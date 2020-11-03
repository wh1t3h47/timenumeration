/* eslint-env browser */

function createTestUser(attempts = 3) {
  const TestUser = [
    "Antonio",
    "Martos Harres",
    "tom.mharres@gmail.com",
    "12345678", // Sorry, I can't choose a better password
  ];

  let resultHandler = (succeed) => {
    if (succeed) {
      return;
    } else {
      if (attempts > 1) {
        attempts -= 1;
        createTestUser(attempts);
        return;
      }
    }
  };

  sendApiSignUp(TestUser, resultHandler); // eslint-disable-line no-undef
}

function randomPass(length) {
  // We use a random pass to avoid hitting cache in bcrypt
  // hashing the same string over and over might get
  // optimized, thus making timing analysis less accurate
  const characters =
    " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
  const charactersLength = characters.length;
  let result = "";
  for (let i = 0; i < length; ++i) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function sendApiLogin(email, password, timingArray) {
  let start;
  fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      password: password,
    }),
  })
    .then(() => {
      const end = performance.now();
      const ellapsed = end - start;
      return Promise.resolve(ellapsed);
    })
    .then((ellapsed) => {
      console.log(`ellapsed ${ellapsed}`);
      timingArray.push(ellapsed);
    });
  start = performance.now();
}

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function returnAvg(timingArray, timingSamples) {
  let avg = 0;
  timingArray.forEach((ellapsedTime) => {
    avg += ellapsedTime;
  });
  return avg / timingSamples;
}

function getTimingSamples() {
  createTestUser(); // TODO: Check if user exist already
  const timingSamples = 50;
  const delayBetweenRequests = 150;
  let timingExistingUser = [];
  let timingInvalidUser = [];
  let passwords = new Array(timingSamples).fill("");

  let verifyReqStatusTimer;

  passwords.map(() => {
    randomPass(30);
  });

  const requestWatcher = () => {
    // This function will run from time to time to verify when
    // all requests are done (as they append to the array when
    // finished and timingSamples is total requests amount
    if (
      timingExistingUser.length == timingSamples &&
      timingInvalidUser.length == timingSamples
    ) {
      clearInterval(verifyReqStatusTimer);
      const existingUserAvg = returnAvg(timingExistingUser, timingSamples);
      const invalidUserAvg = returnAvg(timingInvalidUser, timingSamples);
      const delta = existingUserAvg - invalidUserAvg;
      console.log(delta);
    }
  };

  const fire = (user, storeTiming) => {
    // This function will fire requests from time to time
    // in order to avoid flooding the server and adding
    // blocking time, so we have accurate results
    let firingInterval = 0;
    for (let i = 0; i < timingSamples; ++i) {
      sleep(firingInterval).then(() => {
        sendApiLogin(user, passwords[i], storeTiming);
      });
      firingInterval += delayBetweenRequests;
    }
  };

  fire("tom.mharres@gmail.com", timingExistingUser);

  // Wait until all previous requests are given time to finish
  sleep(delayBetweenRequests * timingSamples).then(() => {
    fire("invalidUser@1337", timingInvalidUser);
  });

  verifyReqStatusTimer = setInterval(requestWatcher, 3000);
}
