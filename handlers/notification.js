const winston = require("winston");
const mongoose = require("mongoose");
const conMysql = require('../mySql');
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");

const Notification = mongoose.model("Notification");
const Project = mongoose.model("Project");

module.exports = (io, client, keyStores, timerIds) => {
    /**
     * keyStores = {
     *  key: {
     *          tiwipab1: {
     *               guest: weerabhat, 
     *               activeUsers: [ tiwipab, weerabhat ] 
     *          } // username merged with section_id as a partner section key's the first user login the website.
     *      }
     * }
     * 
     * keys = {
     *      1: courseName
     * }
     */
    const notificationsId = []
    let keys = {} // section key
    let curUser = 'gentleman'
    let beat = 0
    let pingPong = ''
    let autoDisc = ''

    function sendHeartbeat() {
        client.emit('PING', { beat: beat })
    }

    function automaticallyDisconnect() {
        client.disconnect()
    }

    function reverseId(id) {
        let newId = ""
        for (let index = id.length - 1; index >= 0; index--) {
            newId += id[index]
        }
        return newId
    }

    client.on('PONG', (payload) => {
        if (payload.beat > beat) {
            beat = payload.beat
            pingPong = setTimeout(sendHeartbeat, 5000)
            clearTimeout(autoDisc)
            autoDisc = setTimeout(automaticallyDisconnect, 6000)
        } else {
            clearTimeout(pingPong)
        }
    })

    client.on('join classroom', async (payload) => {
        pingPong = setTimeout(sendHeartbeat, 5000)
        autoDisc = setTimeout(automaticallyDisconnect, 6000)

        curUser = payload.username
        const occupation = payload.occupation

        /**
         * Sections are queried from database
         */
        let sections = {}
        if (occupation === 'student') {
            const queryStudent = `select enrollment_id from student as std 
            join enrollment as en on en.student_id = std.student_id 
            where std.username = \"${curUser}\"`
            const resEnrollmentId = await conMysql.selectEnrollment(queryStudent).catch((err) => {
                throw err
            })

            for (let index in resEnrollmentId) {
                const enrollmentId = resEnrollmentId[index].enrollment_id
                const querySection = `select * from enrollment as en 
                join section as sec on sec.section_id = en.section_id 
                join course as c on c.course_id = sec.course_id 
                where en.enrollment_id = ${enrollmentId}`
                const resSections = await conMysql.selectSection(querySection).catch((err) => {
                    throw err;
                })

                const tmps = { ...resSections[0] }
                Object.assign(sections, { [resSections[0].section_id]: tmps })
            }

        } else if (occupation === 'teacher') {
            const queryTeacher = `select teacher_id from teacher where username = \"${curUser}\"`
            const resTeachers = await conMysql.selectTeacher(queryTeacher).catch((err) => {
                throw err
            })

            const teacherId = resTeachers[0].teacher_id
            const querySection = `select * from teacher as t 
            join course as c on c.teacher_id = t.teacher_id 
            join section as sec on sec.course_id = c.course_id 
            where t.teacher_id = ${teacherId}`
            const resSections = await conMysql.selectSection(querySection).catch((err) => {
                throw err;
            })

            for (let index in resSections) {
                const tmps = { ...resSections[index] }
                Object.assign(sections, { [resSections[index].section_id]: tmps })
            }
        }


        /**
         * Keys are created by to use a section key
         */
        for (let secKey in sections) {
            Object.assign(keys, { [secKey]: sections[secKey].course_name })

            if (keyStores[secKey] === undefined) {
                keyStores[secKey] = {}
            }
        }

        if (occupation === 'student') {
            const stdSecs = {} // store students that enroll to many courses.
            for (let key in keys) {
                const queryStudent = 'select * from student as st join enrollment as e on e.student_id = st.student_id ' +
                    'where e.section_id = ' + key;
                const resStudents = await conMysql.selectStudent(queryStudent).catch((err) => {
                    throw err
                })
                Object.assign(stdSecs, { [key]: resStudents })
            }

            /**
             * Looking for a student information's curUser
             */
            let students = {}
            for (let secKey in stdSecs) {
                for (let index in stdSecs[secKey]) {
                    if (curUser === stdSecs[secKey][index].username) {
                        const tmp = { ...stdSecs[secKey][index] }
                        Object.assign(students, { [secKey]: tmp })
                        break;
                    }
                }
            }

            for (let secKey in students) {
                const pnSecs = { info: null } // store students that are partnerShip's curUser
                if (students[secKey].partner_id !== null) {

                    const queryPartner = 'select * from student as st join enrollment as e on e.student_id = st.student_id where e.enrollment_id = ' + students[secKey].partner_id
                    const resPartners = await conMysql.selectStudent(queryPartner).catch((err) => {
                        throw err
                    })
                    const tmp = { ...resPartners[0] }
                    pnSecs.info = tmp

                    let guest = Object.keys(keyStores[secKey]).find(
                        username => keyStores[secKey][username].guest === curUser
                    )

                    /**
                     * Delete duplicate data
                     */
                    if (keyStores[secKey][curUser] !== undefined
                        && guest !== undefined) {
                        delete keyStores[secKey][guest]
                    }

                    if (keyStores[secKey][curUser] === undefined
                        && guest === undefined) {

                        if (pnSecs.info !== null) {
                            let pnSessionKey = curUser + secKey
                            Object.assign(keyStores[secKey], {
                                [curUser]: {
                                    guest: pnSecs.info.username,
                                    activeUsers: [curUser]
                                }
                            })
                            client.join(pnSessionKey)
                            winston.info(`${curUser} join partner session['${pnSessionKey}']`);
                        } else {
                            console.log('Student has a partnerShip but partner doesn\'t has information.')
                            Object.assign(keyStores[secKey], {
                                [curUser]: { guest: null }
                            })
                        }
                    } else {

                        let tmpUser = guest === undefined ? curUser : guest;
                        if (((keyStores[secKey][tmpUser].guest !== pnSecs.info.username
                            && guest === undefined) ||
                            (tmpUser !== pnSecs.info.username && keyStores[secKey][curUser] === undefined))
                            && Object.keys(pnSecs.info).length) {
                            delete keyStores[secKey][tmpUser]

                            let pnSessionKey = curUser + secKey
                            Object.assign(keyStores[secKey], {
                                [curUser]: {
                                    guest: pnSecs.info.username,
                                    activeUsers: [curUser]
                                }
                            })

                            client.join(pnSessionKey)
                            // winston.info(`${curUser} join partner session['${pnSessionKey}']`);
                        } else if (keyStores[secKey][tmpUser].activeUsers.indexOf(curUser) < 0
                            && Object.keys(pnSecs.info).length) {

                            let pnSessionKey = tmpUser + secKey;
                            keyStores[secKey][tmpUser].activeUsers.push(curUser)
                            client.join(pnSessionKey)
                            // winston.info(`${curUser} join partner session['${pnSessionKey}']`);
                        } else if (Object.keys(pnSecs.info).length) {
                            let pnSessionKey = tmpUser + secKey;
                            client.join(pnSessionKey)
                            // winston.info(`${curUser} join partner session['${pnSessionKey}']`);
                        } else {
                            delete keyStores[secKey][tmpUser]

                            console.log('Student has a partnerShip but partner doesn\'t has information.')
                            Object.assign(keyStores[secKey], {
                                [curUser]: { guest: null }
                            })
                        }
                    }
                } else { // User doesn't has a partnership
                    Object.assign(keyStores[secKey], {
                        [curUser]: { guest: null }
                    })
                }
            }
        } else { // User is a teacher
            for (let secKey in keys) {
                Object.assign(keyStores[secKey], {
                    [curUser]: { guest: null }
                })
            }
        }

        for (let secKey in keys) {
            client.join(secKey)
            // winston.info(`${curUser} join classroom['${secKey}']`);
        }

        const notifications = await getAllNotifications(curUser)
        if (notifications.length) {
            client.emit('notify all', { notifications: notifications, init: 1 })
        }

        timerIds[curUser] = setInterval(async function () {
            const notifications = await getAllNotifications(curUser)
            if (notifications.length) {
                client.emit('notify all', { notifications: notifications, init: 0 })
            }
        }, 5000)
    })

    async function getAllNotifications(curUser) {
        let notifications = await Notification.find({
            $and: [
                { "receiver.username": curUser },
                { nid: { $nin: notificationsId } }
            ]
        }, {
            nid: 1,
            receiver: { $elemMatch: { username: curUser } },
            link: 1,
            head: 1,
            content: 1,
            status: 1,
            type: 1,
            createdBy: 1,
            createdAt: 1,
            info: 1
        })

        for (let index in notifications) {
            const tmpNotifications = notifications[index]
            if (notificationsId.indexOf(tmpNotifications.nid) < 0) {
                if (tmpNotifications.type === `project`) {
                    notificationsId.push(tmpNotifications.nid)
                    const projects = await Project.findOne({
                        pid: tmpNotifications.info.pid
                    })
                    Object.assign(notifications[index]._doc, {
                        available_project: projects.available_project,
                        nid: reverseId(notifications[index]._doc.nid),
                        [tmpNotifications.receiver[0].username]: tmpNotifications.receiver[0].status
                    })
                } else if (tmpNotifications.type === `assignment`) {
                    notificationsId.push(tmpNotifications.nid)
                    Object.assign(notifications[index]._doc, {
                        nid: reverseId(notifications[index]._doc.nid),
                        [tmpNotifications.receiver[0].username]: tmpNotifications.receiver[0].status
                    })
                }
            }
        }

        return notifications
    }

    client.on('clear interval', (payload) => {
        clearInterval(timerIds[payload.timerId])
        delete timerIds[payload.timerId]
    })

    client.on('disconnect', () => {
        if (timerIds[curUser] !== undefined) {
            clearInterval(timerIds[curUser])
        }
        for (let secKey in keys) {
            if (keyStores[secKey] !== undefined) {
                let guest = Object.keys(keyStores[secKey]).find(
                    username => keyStores[secKey][username].guest === curUser
                )

                if (keyStores[secKey][curUser] !== undefined || guest !== undefined) {

                    if (guest !== undefined || keyStores[secKey][curUser].guest !== null) {
                        let pnSessionKey = guest === undefined ? curUser + secKey : guest + secKey;
                        let tmpKey = guest === undefined ? curUser : guest;
                        let numUser = keyStores[secKey][tmpKey].activeUsers.length

                        if (numUser === 1) {
                            delete keyStores[secKey][tmpKey]
                        } else {
                            if (guest === undefined) {
                                let index = keyStores[secKey][tmpKey].activeUsers.indexOf(tmpKey)
                                keyStores[secKey][tmpKey].activeUsers.splice(index, 1)
                            } else {
                                let index = keyStores[secKey][guest].activeUsers.indexOf(keyStores[secKey][guest].guest)
                                keyStores[secKey][guest].activeUsers.splice(index, 1)
                            }
                        }

                        client.leave(pnSessionKey)
                        // winston.info(`${curUser} leave partner session['${pnSessionKey}']`);
                    } else {
                        delete keyStores[secKey][curUser]
                    }
                }

                delete keys[secKey]
                Object.keys(keyStores[secKey]).length === 0 ? delete keyStores[secKey] : null;
                client.leave(secKey)
                // winston.info(`${curUser} leave classroom['${secKey}']`);
            }
        }
    })
}