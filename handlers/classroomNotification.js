const winston = require("winston");
const mongoose = require("mongoose");
const conMysql = require('../mySql');
const moment = require("moment");
const fs = require("fs");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("codebuddy");

const Project = mongoose.model("Project");
const Message = mongoose.model("Message");
const Score = mongoose.model("Score");
const User = mongoose.model("User");
const Comment = mongoose.model("Comment");
const History = mongoose.model("History");

module.exports = (io, client, keyStores) => {
    /**
     * keyStores = {
     *  key: {
     *          tiwipab: { guest: weerabhat, activeUsers: [ tiwipab, weerabhat ] } // tiwipab is the partner session key
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

    client.on('join classroom', async (payload) => {
        const sections = JSON.parse(payload.sections)
        for (let secKey in sections) {
            let decrypt = cryptr.decrypt(sections[secKey])
            Object.assign(keys, { [decrypt]: secKey })

            if (keyStores[decrypt] === undefined) {
                keyStores[decrypt] = {}
            }
        }
        console.log('KeyStores[secKey], ', keyStores)
        curUser = payload.username
        const occupation = payload.occupation
        /**
         * keyStores = {
         *  secKey: {
         *          pnSessionKey: { 
         *              activeProjects: [Object] 
         *          }
         *      }
         * }
         */
        const allNotifications = {}

        if (occupation === 'student') {
            console.log('Already Came in')
            const stdSecs = {} // store students that enroll to many courses.
            for (let key in keys) {
                const queryStudent = 'select * from student as st join enrollment as e on e.student_id = st.student_id ' +
                    'where e.section_id = ' + key;
                const resStudents = await conMysql.selectStudent(queryStudent).catch((err) => {
                    console.log('Connected class socket was an err, ', err)
                    client.emit('connection failed', { err: err })
                    return;
                })
                Object.assign(stdSecs, { [key]: resStudents })
            }
            // console.log('StdSecs, ', stdSecs)

            const assSecs = {} // store asssignments that are created by teacher in each class.
            for (let key in keys) {
                const queryAssignment = 'select * from assignment where section_id = ' + key;
                const resAssignments = await conMysql.selectAssignment(queryAssignment).catch((err) => {
                    console.log('Connected class socket was an err, ', err)
                    client.emit('connection failed', { err: err })
                    return;
                })
                const assignments = {}
                for (let index in resAssignments) {
                    const tmp = { ...resAssignments[index] }
                    Object.assign(assignments, { [tmp.assignment_id]: tmp })
                }
                Object.assign(assSecs, { [key]: assignments })
            }
            // console.log('AssSecs, ', assSecs)

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
                // console.log('Already Came in: Phase2, ', students[secKey].partner_id)
                const pnSecs = { info: null } // store students that are partnerShip's curUser
                if (students[secKey].partner_id !== null) {
                    const queryPartner = 'select * from student as st join enrollment as e on e.student_id = st.student_id where e.enrollment_id = ' + students[secKey].partner_id
                    const resPartners = await conMysql.selectStudent(queryPartner).catch((err) => {
                        console.log('Connected class socket was an err, ', err)
                        client.emit('connection failed', { err: err })
                        return;
                    })
                    const tmp = { ...resPartners[0] }
                    pnSecs.info = tmp
                    // console.log('PnSecs, ', pnSecs)

                    let projects = await Project.find({
                        $or: [{
                            $and: [{ creator: students[secKey].username }, { collaborator: pnSecs.info.username }]
                        }, {
                            $and: [{ creator: pnSecs.info.username }, { collaborator: students[secKey].username }]
                        }]
                    }).sort({ enable_time: -1 })

                    const proObjects = {}
                    /**
                     * To transfer data from projects to proObjects
                     */
                    for (let index in projects) {
                        projects[index]._doc.index = parseInt(index)
                        Object.assign(proObjects, { [projects[index].assignment_id]: projects[index]._doc })
                    }

                    /**
                     * Cut out projects that aren't in the section.
                     */
                    for (let proKey in proObjects) {
                        if (assSecs[secKey][proKey] === undefined) {
                            delete proObjects[proKey]
                        }
                    }
                    // console.log('ProObjects, ', proObjects)

                    const notifications = {}
                    let proObjLength = Object.keys(proObjects).length
                    if (proObjLength !== 0) {
                        for (let proKey in proObjects) {
                            if (compareDate(proObjects[proKey].enable_time, proObjects[proKey].disable_time) > 0) {
                                delete proObjects[proKey].index
                                notifications.activeProjects = proObjects[proKey]
                                break;
                            } else if (compareDate(proObjects[proKey].enable_time, proObjects[proKey].disable_time) <= 0
                                && proObjects[proKey].index === 0) {
                                notifications.activeProjects = null
                                break;
                            }
                        }
                    }

                    let guest = Object.keys(keyStores[secKey]).find(username => keyStores[secKey][username].guest === curUser)
                    if (keyStores[secKey][curUser] === undefined && guest === undefined) {
                        if (occupation === "student" && pnSecs.info !== null) {
                            let pnSessionKey = curUser + secKey
                            Object.assign(pnSessionKeys, { [secKey]: { [pnSessionKey]: 1 } })
                            Object.assign(keyStores[secKey], {
                                [curUser]: {
                                    guest: pnSecs.info.username,
                                    activeUsers: [curUser]
                                }
                            })
                            allNotifications[secKey] = {}
                            Object.assign(allNotifications[secKey], { [pnSessionKey]: { activeProjects: notifications.activeProjects } })
                            client.join(pnSessionKey)
                            winston.info(`${curUser} join partner session['${pnSessionKey}']`);
                        }
                    } else if (guest !== undefined) {
                        let pnSessionKey = guest + secKey
                        Object.assign(pnSessionKeys, { [secKey]: { [pnSessionKey]: 1 } })
                        keyStores[secKey][guest].activeUsers.push(curUser)

                        allNotifications[secKey] = {}
                        Object.assign(allNotifications[secKey], { [pnSessionKey]: { activeProjects: notifications.activeProjects } })
                        client.join(pnSessionKey)
                        winston.info(`${curUser} join partner session['${pnSessionKey}']`);
                    } else if (keyStores[secKey][curUser].guest !== null) {
                        keyStores[secKey][curUser].activeUsers.push(curUser)
                    }
                    // io.in(pnSessionKey).emit('notice', {res: 'Alert'})
                } else {
                    for (let secKey in keys) {
                        Object.assign(keyStores[secKey], {
                            [curUser]: { guest: null }
                        })
                    }
                }
            }
        } else {
            for (let secKey in keys) {
                Object.assign(keyStores[secKey], {
                    [curUser]: { guest: null }
                })
            }
        }
        // console.log('AllNotifications, ', allNotifications, ', activeProjects, ', allNotifications[1].weerabhat1.activeProjects)
        // console.log('KeyStores, ', keyStores, ', activeUsers, ', keyStores[1].weerabhat.activeUsers)
        console.log('KeyStores, ', keyStores)

        for (let secKey in keys) {
            client.join(secKey)
            winston.info(`${curUser} join classroom['${secKey}']`);
            io.in(secKey).emit('notice', { res: 'Alert' })
        }
    })

    function compareDate(date1, date2) {
        if (date1 > date2) return 1;
        else if (date1 === date2) return 0;
        else if (date1 < date2) return -1;
        else return "An illegal date.";
    }

    client.on('disconnect', () => {
        for (let secKey in keys) {
            let guest = Object.keys(keyStores[secKey]).find(username => keyStores[secKey][username].guest === curUser)

            let hasPartner = false
            if (guest !== undefined) {
                hasPartner = true
            } else if (keyStores[secKey][curUser].guest !== null) {
                hasPartner = true
            }

            if (hasPartner) {
                let pnSessionKey = guest === undefined ? curUser + secKey : guest + secKey;
                let tmpKey = guest === undefined ? curUser : guest;
                if (pnSessionKeys[secKey][pnSessionKey] !== undefined) {
                    let numUser = keyStores[secKey][tmpKey].activeUsers.length

                    if (numUser === 1) {
                        delete keyStores[secKey][tmpKey]
                        // console.log('PnSessionKey and SecKey has already removed form Keys and PnSessionKeys.')
                    } else {
                        if (guest === undefined) {
                            let index = keyStores[secKey][tmpKey].activeUsers.indexOf(tmpKey)
                            keyStores[secKey][tmpKey].activeUsers.splice(index, 1)
                        } else {
                            let index = keyStores[secKey][guest].activeUsers.indexOf(keyStores[secKey][guest].guest)
                            keyStores[secKey][guest].activeUsers.splice(index, 1)
                        }
                    }

                    delete pnSessionKeys[secKey];
                    delete keys[secKey]
                    client.leave(pnSessionKey)
                    winston.info(`${curUser} leave partner session['${pnSessionKey}']`);
                } else {
                    // console.log('PnSessionKey is undefined.')
                }
            }

            console.log('KeyStores, keys, pnSessionKeys Before, ', keyStores, ', ', keys, ', ', pnSessionKeys)
            keyStores[secKey][curUser] === null ? delete keyStores[secKey][curUser] : null;
            Object.keys(keyStores[secKey]).length === 0 ? delete keyStores[secKey] : null;
            client.leave(secKey)
            console.log('KeyStores, keys, pnSessionKeys After, ', keyStores, ', ', keys, ', ', pnSessionKeys)
            winston.info(`${curUser} leave classroom['${secKey}']`);
        }
    })
}