/**
 * get query parameter from URL
 * @param {String} scriptName parameter scriptName's the name of script
 * @param {String} name parameter name that you want to get variable from
 * https://stackoverflow.com/questions/2190801/passing-parameters-to-javascript-files/2190927?noredirect=1#comment47136074_2190927
 */
function getVarFromScript(scriptName, name) {
    const data = $(`script[src*=${scriptName}]`)
    const variable = data.attr(name)
    if (typeof variable === undefined) {
        console.log('Error: ', variable)
    }
    return variable
}

/**
 * Websocket.io instance
 */
const classNotiSocket = io('');
classNotiSocket.emit('notification', {})

/**
 * get query parameter from URL
 * @param {String} name parameter name that you want to get value from
 * http://stackoverflow.com/a/901144/4181203
 */
function getParameterByName(name) {
    const url = window.location.href;
    const terms = url.split('\/')
    const index = terms.indexOf(name)
    try {
        const result = terms[index + 1]
        return result
    } catch (err) {
        return null;
    }
}

classNotiSocket.emit('join classroom', {
    username: getVarFromScript('notification', 'data-username'),
    occupation: getVarFromScript('notification', 'data-occupation')
})

classNotiSocket.on('connection failed', (payload) => {

})

classNotiSocket.on('PING', (payload) => {
    let newBeat = payload.beat + 1
    console.log('Newbeat, ', newBeat)
    classNotiSocket.emit('PONG', { beat: newBeat })
})

function createProjectNotificationElement(info, own) {
    if (own === `receiver`) {
        const item = $(`<div id="${info.nid}Item" class="item" style="width: 420px; padding: 10px; margin: 5px; background-color:#E5EAF2;">` +
            `</div>`)
        const content = $(`<div class="content">` +
            `<div class="header">${info.head}</div>` +
            `<div class="description"><p>${info.content}</p></div>` +
            `</div>`)
        const extra = $(`<div class="extra">` +
            `<i class="edit icon"></i>${moment(info.createdAt).fromNow()}` +
            `<div id="${info.nid}Btn" class="ui right floated primary button" onclick="location.href='${info.link}';")">Join</div>` +
            `</div>`)
        content.append(extra)
        item.append(content)
        return item
    } else if (own === `sender`) {
        const item = $(`<div class="item" style="pointer-events: none; width: 420px; padding: 10px; margin: 5px; background-color:white;">` +
            `</div>`)
        const content = $(`<div class="content">` +
            `<div class="header">${info.head}</div>` +
            `<div class="description"><p>${info.content}</p></div>` +
            `<div class="extra">` +
            `<i class="edit icon"></i>${moment(info.createdAt).fromNow()}</div>` +
            `</div>`)
        item.append(content)
        return item
    }
}

function onClickJoinProject(element, nid = null, link = null) {
    console.log('Nid, ', nid, ', Link, ', link, ', element, ', element)
    // $.ajax({
    //     url: `/notification/updateProjectNotification`,
    //     type: `put`,
    //     data: data
    // })
    // element.attr({
    //     onclick: `location.href="${ data.link }";`
    // })
    // element.click()
}

classNotiSocket.on('finished project notification', (payload) => {
    classNotiSocket.emit('clear interval', {
        timerId: payload.timerId
    })
    // console.log('Finished Project!')
    $(`#${payload.nid}Btn`).remove()
    $(`#${payload.nid}Item`).attr({
        style: `pointer-events: none;` +
            ` width: 420px;` +
            ` padding: 10px;` +
            ` margin: 5px;` +
            ` background-color:white;`
    })
    let count = parseInt($('#alarmNoti').text())
    if (count > 0) {
        count -= 1
    }
    $('#alarmNoti').text(count)
})

classNotiSocket.on('notify all', (payload) => {
    const notifications = payload.notifications
    if (notifications !== null) {
        $('#noNotifications').remove()
        $('#notiItems').empty()
        let count = 0
        for (let index in notifications) {
            if (notifications[index].status === `pending` && notifications[index].available_project) {
                count++
                let notificationElement = createProjectNotificationElement(notifications[index], `receiver`)
                $('#notiItems').append(notificationElement)
            } else {
                let notificationElement = createProjectNotificationElement(notifications[index], `sender`)
                $('#notiItems').append(notificationElement)
            }
        }
        $('#alarmNoti').text(count)
    }
})

classNotiSocket.on('notify to join project', (payload) => {
    const username = getVarFromScript('notification', 'data-username')

    if (Object.keys(payload.notifications).length
        && payload.notifications.receiver.indexOf(username) >= 0) {
        if ($('#noNotifications').length) {
            $('#noNotifications').remove()
            $('#notiItems').empty()
        }

        if (username === payload.notifications.createdBy) {
            let notificationElement = createProjectNotificationElement(payload.notifications, `sender`)
            $('#notiItems').prepend(notificationElement)
            let count = parseInt($('#alarmNoti').text()) + 1
            $('#alarmNoti').text(count)
        } else {
            let notificationElement = createProjectNotificationElement(payload.notifications, `receiver`)
            $('#notiItems').prepend(notificationElement)
            let count = parseInt($('#alarmNoti').text()) + 1
            $('#alarmNoti').text(count)
        }
    }
})

classNotiSocket.on('test notification', () => {
    alert('TEST!!')
})

classNotiSocket.on('create new project notification', (payload) => {
    const username = getVarFromScript('notification', 'data-username')
    console.log('Server response!!')

    if (username === payload.username) {
        classNotiSocket.emit('clear interval', {
            timerId: payload.timerId
        })
        $.post('/notifications/createProjectNotification', payload, (res) => {
            if (Object.keys(res.notifications).length) {
                classNotiSocket.emit('notify to join project', {
                    notifications: res.notifications,
                    sectionId: getParameterByName(`section`)
                })
            } else {
                alert('Something wrong!!')
            }
        })
    }
})