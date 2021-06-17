/**
 * get query parameter from URL
 * @param {String} scriptName parameter scriptName's the name of script
 * @param {String} name parameter name that you want to get variable from
 * https://stackoverflow.com/questions/2190801/passing-parameters-to-javascript-files/2190927?noredirect=1#comment47136074_2190927
 */
function getDataFromScript(scriptName, name) {
  const data = $(`script[src*=${scriptName}]`);
  const variable = data.attr(name);
  if (typeof variable === undefined) {
    console.log("Error: ", variable);
  }
  return variable;
}

/**
 * Websocket.io instance
 */
const classNotiSocket = io("");
classNotiSocket.emit("notification", {});

classNotiSocket.emit("join classroom", {
  username: getDataFromScript("notification", "data-username"),
  occupation: getDataFromScript("notification", "data-occupation"),
});

classNotiSocket.on("connection failed", (payload) => {});

classNotiSocket.on("PING", (payload) => {
  let newBeat = payload.beat + 1;
  classNotiSocket.emit("PONG", { beat: newBeat });
});

function createProjectNotificationElement(info, own) {
  if (own === `receiver`) {
    const item = $(
      `<div id="${info.nid}" class="receiver notification-project-item item">` +
        `</div>`
    );
    const content = $(
      `<div class="content">` +
        `<div class="header">${info.head}</div>` +
        `<div class="description"><pre>${info.content}</pre></div>` +
        `</div>`
    );
    const extra = $(
      `<div class="extra">` +
        `<i class="edit icon"></i>${moment(info.createdAt).fromNow()}` +
        `<div id="${info.nid}Btn" class="ui right floated primary button" onclick="onClickJoinProject($(this), \`${info.nid}\`, \`${info.link}\`)")">เข้าร่วม</div>` +
        `</div>`
    );
    content.append(extra);
    item.append(content);
    return item;
  } else if (own === `sender`) {
    const item = $(
      `<div class="sender notification-project-item item">` + `</div>`
    );
    const content = $(
      `<div class="content">` +
        `<div class="header">${info.head}</div>` +
        `<div class="description"><pre>${info.content}</pre></div>` +
        `<div class="extra">` +
        `<i class="edit icon"></i>${moment(info.createdAt).fromNow()}</div>` +
        `</div>`
    );
    item.append(content);
    return item;
  }
}

function createAssignmentNotificationElement(info, own) {
  if (own === `receiver`) {
    const aTag = $(`<a href='${info.link}'></a>`);
    const item = $(
      `<div class="item" style="pointer-events: none; width: 420px; padding: 10px; margin: 5px; background-color:#E5EAF2;">` +
        `</div>`
    );
    const content = $(
      `<div class="content">` +
        `<div class="header">${info.head}</div>` +
        `<div class="description"><pre>${info.content}</pre></div>` +
        `<div class="extra">` +
        `<i class="edit icon"></i>${moment(info.createdAt).fromNow()}</div>` +
        `</div>`
    );
    item.append(content);
    aTag.append(item);
    return aTag;
  } else if (own === `sender`) {
    const aTag = $(`<a href='${info.link}'></a>`);
    const item = $(
      `<div class="item" style="pointer-events: none; width: 420px; padding: 10px; margin: 5px; background-color:white;">` +
        `</div>`
    );
    const content = $(
      `<div class="content">` +
        `<div class="header">${info.head}</div>` +
        `<div class="description"><pre>${info.content}</pre></div>` +
        `<div class="extra">` +
        `<i class="edit icon"></i>${moment(info.createdAt).fromNow()}</div>` +
        `</div>`
    );
    item.append(content);
    aTag.append(item);
    return aTag;
  }
}

function createSystemUsageNotificationElement(info, status) {
  if (status === `no interact`) {
    const item = $(
      `<div id="${info.nid}Item" class="item" style="width: 420px; padding: 10px; margin: 5px; background-color:#E5EAF2;" onclick="onClickSysmtemUsageElement(\`${info.nid}\`, \`${info.type}\`)">` +
        `</div>`
    );
    const content = $(
      `<div class="content">` +
        `<div class="header">${info.head}</div>` +
        `<div class="description"><pre>${info.content}</pre></div>` +
        `</div>`
    );
    const extra = $(
      `<div class="extra">` +
        `<i class="sign in alternate icon"></i>${moment(
          info.createdAt
        ).fromNow()}` +
        `</div>`
    );
    content.append(extra);
    item.append(content);
    return item;
  } else if (status === `interacted`) {
    const item = $(
      `<div class="item" style="pointer-events: none; width: 420px; padding: 10px; margin: 5px; background-color:white;">` +
        `</div>`
    );
    const content = $(
      `<div class="content">` +
        `<div class="header">${info.head}</div>` +
        `<div class="description"><pre>${info.content}</pre></div>` +
        `<div class="extra">` +
        `<i class="sign in alternate icon"></i>${moment(
          info.createdAt
        ).fromNow()}</div>` +
        `</div>`
    );
    item.append(content);
    return item;
  }
}

function onClickSysmtemUsageElement(nid, type) {
  data = { nid: nid };
  if (type === "systemUsage") {
    $.ajax({
      url: `/notifications/change/system/usage/status`,
      type: `put`,
      data: data,
      success: function (data) {
        if (data === "OK") {
          count = parseInt($("#num-of-notification").text()) - 1;
          if (count < 0) {
            count = 0;
          }
          $("#num-of-notification").text(count);
          $(`#${nid}Item`).attr({
            style:
              "pointer-events: none; width: 420px; padding: 10px; margin: 5px; background-color:white;",
          });
        } else {
          alert(`The server has a problem!`);
        }
      },
    });
  }
}

function onClickJoinProject(element = null, nid = null, link = null) {
  data = { nid: nid, link: link };
  $("#global-loader").attr({
    style: "position:fixed; display:block;",
  });
  $.ajax({
    url: `/notifications/changeProjectNotificationStatus`,
    type: `put`,
    data: data,
    success: function (data) {
      $("#global-loader").attr({
        style: "position:fixed; display:none;",
      });
      if (data === "OK") {
        element.attr({
          onclick: `location.href="${link}";`,
        });
        element.click();
      } else {
        alert(`The server has a problem!`);
      }
    },
  });
}

classNotiSocket.on("disable project notification", (payload) => {
  classNotiSocket.emit("clear interval", {
    timerId: payload.timerId,
  });
  const reversedNotificationsId = payload.reversedNotificationsId;
  for (let index in reversedNotificationsId) {
    $(`#${reversedNotificationsId[index]}Btn`).remove();
    $(`#${reversedNotificationsId[index]}Item`).attr({
      style:
        `pointer-events: none;` +
        ` width: 420px;` +
        ` padding: 10px;` +
        ` margin: 5px;` +
        ` background-color:white;`,
    });
  }
  let count =
    parseInt($("#num-of-notification").text()) - reversedNotificationsId.length;
  if (count < 0) {
    count = 0;
  }
  $("#num-of-notification").text(count);
});

classNotiSocket.on("notify all", (payload) => {
  const username = getDataFromScript("notification", "data-username");
  const notifications = payload.notifications;
  if (notifications !== null) {
    if ($("#notification-text").length) {
      $("#notification-text").remove();
      $("#notification-items").empty();
    }

    let count = 0;
    if (!payload.init) {
      count = parseInt($("#num-of-notification").text());
    }

    for (let key in notifications) {
      if (
        notifications[key].type === `project` &&
        notifications[key][username] === `no interact` &&
        notifications[key].available_project &&
        notifications[key].createdBy !== username
      ) {
        count++;
        let notificationElement = createProjectNotificationElement(
          notifications[key],
          `receiver`
        );
        $("#notification-items").prepend(notificationElement);
      } else if (
        notifications[key].type === `project` &&
        notifications[key][username] === `interacted`
      ) {
        let notificationElement = createProjectNotificationElement(
          notifications[key],
          `sender`
        );
        $("#notification-items").prepend(notificationElement);
      } else if (
        notifications[key].type === `assignment` &&
        notifications[key][username] === `no interact`
      ) {
        count++;
        let notificationElement = createAssignmentNotificationElement(
          notifications[key],
          `receiver`
        );
        $("#notification-items").prepend(notificationElement);
      } else if (
        notifications[key].type === `assignment` &&
        notifications[key][username] === `interacted`
      ) {
        let notificationElement = createAssignmentNotificationElement(
          notifications[key],
          `sender`
        );
        $("#notification-items").prepend(notificationElement);
      } else if (
        notifications[key].type === `systemUsage` &&
        notifications[key].createdBy !== username
      ) {
        let status = notifications[key][username];
        if (status === `no interact`) {
          count++;
        }
        let notificationElement = createSystemUsageNotificationElement(
          notifications[key],
          status
        );
        $("#notification-items").prepend(notificationElement);
      }
    }
    $("#num-of-notification").text(count);
  }
});

classNotiSocket.on("test notification", () => {
  alert("TEST!!");
});
