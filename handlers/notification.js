const winston = require("winston");
const mongoose = require("mongoose");
const conMysql = require('../mySql');
const moment = require("moment");
const fs = require("fs");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");

const Notification = mongoose.model("Notification");
const Project = mongoose.model("Project");
const Message = mongoose.model("Message");
const Score = mongoose.model("Score");
const User = mongoose.model("User");
const Comment = mongoose.model("Comment");
const History = mongoose.model("History");

module.exports = (io, client, keyStores, timerIds) => {
    /**
     * keyStores = {
     *  key: {
     *          tiwipab: { guest: weerabhat, activeUsers: [ tiwipab, weerabhat ], pairingSessionId: 1 } // tiwipab is the partner session key
     *      }
     * }
     * 
     * keys = {
     *  1: courseName
     * }
     * 
     * pnSessionKeys = {
     *  1: {
     *          pnSessionKey: 1
     *      }
     * }
     */
    let keys = {} // section key
    let pnSessionKeys = {} // partner session key
    let curUser = 'gentleman'
    let beat = 0
    let pingPong = ''
    let autoDisc = ''

    function sendHeartbeat() {
        // pingPong = setTimeout(sendHeartbeat, 2000)
        // autoDisc = setTimeout(automaticallyDisconnect, 3000)
        client.emit('PING', { beat: beat })
    }

    function automaticallyDisconnect() {
        client.disconnect()
    }

    client.on('PONG', (payload) => {
        // console.log('New, ', payload.beat, ', Old, ', beat)
        if (payload.beat > beat) {
            beat = payload.beat
            pingPong = setTimeout(sendHeartbeat, 2000)
            clearTimeout(autoDisc)
            autoDisc = setTimeout(automaticallyDisconnect, 3000)
        } else {
            clearTimeout(pingPong)
        }
    })

    client.on('join classroom', async (payload) => {
        pingPong = setTimeout(sendHeartbeat, 2000)
        autoDisc = setTimeout(automaticallyDisconnect, 3000)

        curUser = payload.username
        const occupation = payload.occupation
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


        for (let secKey in sections) {
            Object.assign(keys, { [secKey]: sections[secKey].course_name })

            if (keyStores[secKey] === undefined) {
                keyStores[secKey] = {}
            }
        }
        // console.log('KeyStores[secKey], ', keyStores)
        /**
         * keyStores = {
         *  secKey: {
         *          pnSessionKey: { 
         *              projects: [Object] 
         *          }
         *      }
         * }
         */

        if (occupation === 'student') {
            // console.log('Already Came in')
            const stdSecs = {} // store students that enroll to many courses.
            for (let key in keys) {
                const queryStudent = 'select * from student as st join enrollment as e on e.student_id = st.student_id ' +
                    'where e.section_id = ' + key;
                const resStudents = await conMysql.selectStudent(queryStudent).catch((err) => {
                    throw err
                })
                Object.assign(stdSecs, { [key]: resStudents })
            }
            // console.log('StdSecs, ', stdSecs)

            /**
             * Looking for object's curUser
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
            // console.log('Students, ', students)

            for (let secKey in students) {
                const pnSecs = { info: null } // store students that are partnerShip's curUser
                if (students[secKey].partner_id !== null) {

                    const queryPartner = 'select * from student as st join enrollment as e on e.student_id = st.student_id where e.enrollment_id = ' + students[secKey].partner_id
                    const resPartners = await conMysql.selectStudent(queryPartner).catch((err) => {
                        throw err
                    })
                    const tmp = { ...resPartners[0] }
                    pnSecs.info = tmp

                    let guest = Object.keys(keyStores[secKey]).find(username => keyStores[secKey][username].guest === curUser)
                    /**
                     * Duplicate data
                     */
                    if (keyStores[secKey][curUser] !== undefined && guest !== undefined) {
                        console.log('Delete!')
                        delete keyStores[secKey][guest]
                    }

                    if (keyStores[secKey][curUser] === undefined && guest === undefined) {

                        if (pnSecs.info !== null) {
                            let pnSessionKey = curUser + secKey
                            Object.assign(pnSessionKeys, { [secKey]: { [pnSessionKey]: 1 } })
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
                        // console.log('Keys Length, ', Object.keys(pnSecs.info).length, ', Keys, ', Object.keys(pnSecs.info))

                        if (keyStores[secKey][curUser] !== undefined || keyStores[secKey][guest] !== undefined) {
                            // console.log('1')
                            let tmpUser = guest === undefined ? curUser : guest;
                            if (((keyStores[secKey][tmpUser].guest !== pnSecs.info.username && guest === undefined) ||
                                (tmpUser !== pnSecs.info.username && keyStores[secKey][curUser] === undefined))
                                && Object.keys(pnSecs.info).length) {
                                // console.log('1.1')
                                delete keyStores[secKey][tmpUser]

                                let pnSessionKey = curUser + secKey
                                Object.assign(keyStores[secKey], {
                                    [curUser]: {
                                        guest: pnSecs.info.username,
                                        activeUsers: [curUser]
                                    }
                                })

                                client.join(pnSessionKey)
                                winston.info(`${curUser} join partner session['${pnSessionKey}']`);
                            } else if (keyStores[secKey][tmpUser].activeUsers.indexOf(curUser) < 0 && Object.keys(pnSecs.info).length) {
                                // console.log('1.2')
                                let pnSessionKey = tmpUser + secKey;
                                keyStores[secKey][tmpUser].activeUsers.push(curUser)
                                client.join(pnSessionKey)
                                // io.in(pnSessionKey).emit('test notification', {})
                                winston.info(`${curUser} join partner session['${pnSessionKey}']`);
                            } else if (Object.keys(pnSecs.info).length) {
                                // console.log('1.3')
                                let pnSessionKey = tmpUser + secKey;
                                client.join(pnSessionKey)
                                winston.info(`${curUser} join partner session['${pnSessionKey}']`);
                            } else {
                                // console.log('1.4')
                                delete keyStores[secKey][tmpUser]

                                console.log('Student has a partnerShip but partner doesn\'t has information.')
                                Object.assign(keyStores[secKey], {
                                    [curUser]: { guest: null }
                                })
                            }
                        }
                    }
                } else {
                    Object.assign(keyStores[secKey], {
                        [curUser]: { guest: null }
                    })
                }
            }
        } else {
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

        /**
         * Notify all to user
         */
        let notifications = await Notification.find({
            own: curUser
        }).sort({ createdAt: -1 })

        for (let index in notifications) {
            const tmpNotifications = notifications[index]
            if (tmpNotifications.type === `project`) {
                const projects = await Project.findOne({
                    pid: tmpNotifications.info.pid
                })
                Object.assign(notifications[index]._doc, { available_project: projects.available_project })
            }
        }

        if (notifications.length) {
            client.emit('notify all', { notifications: notifications })
        }
    })

    function compareDate(date1, date2) {
        if (date1 > date2) return 1;
        else if (date1 === date2) return 0;
        else if (date1 < date2) return -1;
        else return "An illegal date.";
    }

    client.on('clear interval', (payload) => {
        clearInterval(timerIds[payload.timerId])
    })

    client.on('notify to join project', (payload) => {
        let sectionId = cryptr.decrypt(payload.sectionId)
        let guest = Object.keys(keyStores[sectionId]).find(username => keyStores[sectionId][username].guest === curUser)
        let pnSessionKey = guest === undefined ? curUser + sectionId : guest + sectionId;

        if (Object.keys(payload).length) {
            io.in(pnSessionKey).emit('notify to join project', {
                curUser: payload.curUser,
                partner: payload.partner
            })
        }
    })

    client.on('disconnect', () => {
        // console.log('KeyStores Before, ', keyStores)
        for (let secKey in keys) {
            let guest = Object.keys(keyStores[secKey]).find(username => keyStores[secKey][username].guest === curUser)

            if (keyStores[secKey][curUser] !== undefined || guest !== undefined) {
                // console.log('D1')

                if (guest !== undefined || keyStores[secKey][curUser].guest !== null) {
                    // console.log('D2')
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
                    console.log('D3')
                    // winston.info(`${curUser} leave partner session['${pnSessionKey}']`);
                } else {
                    delete keyStores[secKey][curUser]
                }
            }

            delete keys[secKey]
            Object.keys(keyStores[secKey]).length === 0 ? delete keyStores[secKey] : null;
            client.leave(secKey)
            // console.log('KeyStores After, ', keyStores)
            // console.log('KeyStores, keys, pnSessionKeys Before, ', keyStores, ', ', keys, ', ', pnSessionKeys)
            // console.log('KeyStores, keys, pnSessionKeys After, ', keyStores, ', ', keys, ', ', pnSessionKeys)
            // winston.info(`${curUser} leave classroom['${secKey}']`);
        }
    })
}