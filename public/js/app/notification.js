/**
 * get query parameter from URL
 * @param {String} scriptName parameter scriptName's the name of script
 * @param {String} name parameter name that you want to get variable from
 * https://stackoverflow.com/questions/2190801/passing-parameters-to-javascript-files/2190927?noredirect=1#comment47136074_2190927
 */
function getVarFromScript(scriptName, name) {
    const data = $(`script[src*=${scriptName}]`)
    let variable = data.attr(name)
    if (typeof variable === undefined) {
        console.log('Error: ', variable)
    }
    return variable
}

const classNotiSocket = io('');
const username = getVarFromScript('notification', 'data-username')
const occupation = getVarFromScript('notification', 'data-occupation')
console.log('Username, ', username, ', Occupation, ', occupation)
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
    username: username,
    occupation: occupation
})

classNotiSocket.on('connection failed', {

})

classNotiSocket.on('notice', (payload) => {
    console.log('Payload, ', payload)
    $.get('/notifications', payload, (res) => {
        const ServRes = JSON.stringify(res)
        console.log('ServRes, ', ServRes)
        alert('Server response')
    })
})