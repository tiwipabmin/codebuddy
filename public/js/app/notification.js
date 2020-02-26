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

classNotiSocket.on('notify all', (payload) => {
    const notifications = payload.notifications
    console.log('Notifications, ', notifications)
    if (notifications !== null) {
        $('#noNotifications').remove()
        $('#notiItems').empty()
        for (let index in notifications) {
            if (notifications[index].process === `pending` && notifications[index].available_project) {
                const item = $(`<div class="item" style="width: 420px; padding: 10px; margin: 5px; background-color:#E5EAF2;">`+
                `</div>`)
                const content = $(`<div class="content">`+
                `<div class="header">${notifications[index].head}</div>`+
                `<div class="description"><p>${notifications[index].content}</p></div>`+
                `</div>`)
                const extra = $(`<div class="extra">`+
                `<i class="edit icon"></i>${moment(notifications[index].createdAt).fromNow()}`+
                `<div class="ui right floated primary button" onclick="location.href='${notifications[index].link}';">Join</div>`+
                `</div>`)
                content.append(extra)
                item.append(content)
                $('#notiItems').append(item)
            } else {
                const item = $(`<div class="item" style="pointer-events: none; width: 420px; padding: 10px; margin: 5px; background-color:white;">`+
                `</div>`)
                const content = $(`<div class="content">`+
                `<div class="header">${notifications[index].head}</div>`+
                `<div class="description"><p>${notifications[index].content}</p></div>`+
                `<div class="extra">`+
                `<i class="edit icon"></i>${moment(notifications[index].createdAt).fromNow()}</div>`+
                `</div>`)
                item.append(content)
                $('#notiItems').append(item)
            }
        }
        $('#alarmNoti').text($('#notiItems').children().length)
        $('#alarmNoti').attr("style", "display: block;")
    }
})

classNotiSocket.on('notify to join project', (payload) => {
    const username = getVarFromScript('notification', 'data-username')

    if (Object.keys(payload).length
        && Object.keys(payload.curUser).length
        && Object.keys(payload.partner).length) {
        if ($('#noNotifications').length) {
            $('#noNotifications').remove()
            $('#notiItems').empty()
        }
        // console.log('Element, ', $('#noNotifications').length)
        if (username === payload.curUser.own) {
            // alert('Payload.curUser.Own')
            const item = $(`<div class="item" style="pointer-events: none; width: 420px; padding: 10px; margin: 5px; background-color:white;">`+
            `</div>`)
            const content = $(`<div class="content">`+
            `<div class="header">${payload.curUser.head}</div>`+
            `<div class="description"><p>${payload.curUser.content}</p></div>`+
            `<div class="extra">`+
            `<i class="edit icon"></i>${moment(payload.curUser.createdAt).fromNow()}</div>`+
            `</div>`)
            item.append(content)
            $('#notiItems').append(item)
            $('#alarmNoti').text($('#notiItems').children().length)
            $('#alarmNoti').attr("style", "display: block;")
        } else {
            const item = $(`<div class="item" style="width: 420px; padding: 10px; margin: 5px; background-color:#E5EAF2;">`+
            `</div>`)
            const content = $(`<div class="content">`+
            `<div class="header">${payload.partner.head}</div>`+
            `<div class="description"><p>${payload.partner.content}</p></div>`+
            `</div>`)
            const extra = $(`<div class="extra">`+
            `<i class="edit icon"></i>${moment(payload.partner.createdAt).fromNow()}`+
            `<div class="ui right floated primary button" onclick="location.href='${payload.partner.link}';">Join</div>`+
            `</div>`)
            content.append(extra)
            item.append(content)
            $('#notiItems').append(item)
            $('#alarmNoti').text($('#notiItems').children().length)
            $('#alarmNoti').attr("style", "display: block;")
        }
    }
})

classNotiSocket.on('test notification', (payload) => {
    alert('TEST!!')
})

classNotiSocket.on('create new project notification', (payload) => {
    const username = getVarFromScript('notification', 'data-username')
    console.log('Server response!!')

    if (username === payload.username) {
        classNotiSocket.emit('clear interval', {
            timerId: payload.timerId
        })
        $.post('/notifications/createNewProjectNotification', payload, (res) => {
            if (Object.keys(res.notifications).length) {
                classNotiSocket.emit('notify to join project', {
                    curUser: res.notifications.curUser,
                    partner: res.notifications.partner,
                    sectionId: getParameterByName(`section`)
                })
            } else {
                alert('Something wrong!!')
            }
        })
    }
})