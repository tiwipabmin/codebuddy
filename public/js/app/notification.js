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
            `<div id="${info.nid}Btn" class="ui right floated primary button" onclick="onClickJoinProject($(this), \`${info.nid}\`, \`${info.link}\`)")">Join</div>` +
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

function createAssignmentNotificationElement(info, own) {
    if (own === `receiver`) {
        const aTag = $(`<a href='${info.link}'></a>`)
        const item = $(`<div class="item" style="pointer-events: none; width: 420px; padding: 10px; margin: 5px; background-color:#E5EAF2;">` +
            `</div>`)
        const content = $(`<div class="content">` +
            `<div class="header">${info.head}</div>` +
            `<div class="description"><p>${info.content}</p></div>` +
            `<div class="extra">` +
            `<i class="edit icon"></i>${moment(info.createdAt).fromNow()}</div>` +
            `</div>`)
        item.append(content)
        aTag.append(item)
        return aTag
    } else if (own === `sender`) {
        console.log('Asssignment of sender!!')
        const aTag = $(`<a href='${info.link}'></a>`)
        const item = $(`<div class="item" style="pointer-events: none; width: 420px; padding: 10px; margin: 5px; background-color:white;">` +
            `</div>`)
        const content = $(`<div class="content">` +
            `<div class="header">${info.head}</div>` +
            `<div class="description"><p>${info.content}</p></div>` +
            `<div class="extra">` +
            `<i class="edit icon"></i>${moment(info.createdAt).fromNow()}</div>` +
            `</div>`)
        item.append(content)
        aTag.append(item)
        return aTag
    }
}

function onClickJoinProject(element = null, nid = null, link = null) {
    data = { nid: nid, link: link }
    $.ajax({
        url: `/notifications/changeProjectNotificationStatus`,
        type: `put`,
        data: data
    })
    element.attr({
        onclick: `location.href="${link}";`
    })
    element.click()
}

classNotiSocket.on('disable project notification', (payload) => {
    classNotiSocket.emit('clear interval', {
        timerId: payload.timerId
    })
    const reversedNotificationsId = payload.reversedNotificationsId
    for (let index in reversedNotificationsId) {
        $(`#${reversedNotificationsId[index]}Btn`).remove()
        $(`#${reversedNotificationsId[index]}Item`).attr({
            style: `pointer-events: none;` +
                ` width: 420px;` +
                ` padding: 10px;` +
                ` margin: 5px;` +
                ` background-color:white;`
        })
    }
    let count = parseInt($('#alarmNoti').text()) - reversedNotificationsId.length
    if (count < 0) {
        count = 0
    }
    $('#alarmNoti').text(count)
})

classNotiSocket.on('notify all', (payload) => {
    const username = getVarFromScript('notification', 'data-username')
    const notifications = payload.notifications
    if (notifications !== null) {
        if ($('#noNotifications').length) {
            $('#noNotifications').remove()
            $('#notiItems').empty()
        }

        let count = 0
        if (!payload.init) {
            count = parseInt($('#alarmNoti').text())
        }

        for (let index in notifications) {
            if (notifications[index].type === `project`
                && notifications[index][username] === `no interact`
                && notifications[index].available_project
                && notifications[index].createdBy !== username) {
                count++
                let notificationElement = createProjectNotificationElement(notifications[index], `receiver`)
                $('#notiItems').prepend(notificationElement)
            } else if (notifications[index].type === `project`
                && notifications[index][username] === `interacted`) {
                let notificationElement = createProjectNotificationElement(notifications[index], `sender`)
                $('#notiItems').prepend(notificationElement)
            } else if (notifications[index].type === `assignment`
                && notifications[index][username] === `no interact`) {
                count++
                let notificationElement = createAssignmentNotificationElement(notifications[index], `receiver`)
                $('#notiItems').prepend(notificationElement)
            } else if (notifications[index].type === `assignment`
                && notifications[index][username] === `interacted`) {
                let notificationElement = createAssignmentNotificationElement(notifications[index], `sender`)
                $('#notiItems').prepend(notificationElement)
            }
        }
        $('#alarmNoti').text(count)
        console.log('Count, ', $('#alarmNoti').text(), ', payload.init, ', payload.init)
    }
})

classNotiSocket.on('test notification', () => {
    alert('TEST!!')
})