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

$(document).ready(() => {
    const status = getVarFromScript('profile', 'data-status')
    console.log(status)
    if (status !== "undefined") {
        alert(status)
    }
})

function openFormToChangePassword(username) {
    $('#currentPasswordField').empty()

    let currentPasswordField = $("<label>Current Password</label><input type=\"password\" name=\"currentPassword\" placeholder=\"Current Password\" required/>")
    let newPasswordField = $("<div id=\"newPasswordField\" class=\"field\"><label>New Password</label><input type=\"password\" name=\"newPassword\" placeholder=\"New Password\" required/></div>")
    let confirmPasswordField = $("<div id=\"confirmPasswordField\" class=\"field\"><label>Confirm Password</label><input type=\"password\" name=\"confirmPassword\" placeholder=\"Confirm Password\" required/></div>")

    $('#currentPasswordField').append(currentPasswordField)
    newPasswordField.insertAfter('#currentPasswordField')
    confirmPasswordField.insertAfter('#newPasswordField')

    let isClickEditProfile = $('#profileFormBtn').text()
    if (isClickEditProfile === 'Edit Profile') {
        $('#profileForm').attr({
            action: `/profile/${username}`,
            method: `POST`
        })
        $('#profileFormBtn').attr({
            class: "ui green button",
            onclick: "onClickSubmit()"
        })

        $('#profileFormBtn').text("Confirm")
    }
}

function editProfile(username, email, firstName, lastName) {
    // $('#currentPasswordField').empty()
    $('#emailField').empty();
    $('#firstNameField').empty();
    $('#lastNameField').empty();

    // let currentPasswordField = $(`<label>Password</label><div id=\"changePasswordBtn\" class=\"ui button\" onclick=\"openFormToChangePassword()\" >Change Password</div>`)
    let emailField = $(`<label>Email</label><input type=\"text\" name=\"email\" value=${email} required/>`)
    let firstNameField = $(`<label>First Name</label><input type=\"text\" name=\"firstname\" value=${firstName} required/>`)
    let lastNameField = $(`<label>Last Name</label><input type=\"text\" name=\"lastname\" value=${lastName} required/>`)

    // $('#currentPasswordField').append(currentPasswordField)
    $('#emailField').append(emailField)
    $('#firstNameField').append(firstNameField)
    $('#lastNameField').append(lastNameField)

    $('#profileForm').attr({
        action: `/profile/${username}`,
        method: `POST`
    })
    $('#profileFormBtn').attr({
        class: "ui green button",
        onclick: "onClickSubmit()"
    })

    $('#profileFormBtn').text("Confirm")
}

function onClickSubmit() {
    $('#profileFormBtn').removeAttr("onclick")
    $('#profileFormBtn').attr({
        type: "submit"
    })
    $('#profileFormBtn').click();
    $('#profileFormBtn').attr({
        type: "button"
    })
}