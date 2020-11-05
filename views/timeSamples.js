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

function sendApiLogin(
  email,
  password,
  usePerformanceApi,
  updateRequestsCallback,
  timingArray
) {
  const requestParams = [
    "/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    },
  ];

  if (usePerformanceApi) {
    fetch(...requestParams).then(() => {
      updateRequestsCallback();
    });
  } else {
    let start;
    fetch(...requestParams)
      .then(() => {
        const end = performance.now();
        const ellapsed = end - start;
        return Promise.resolve(ellapsed);
      })
      .then((ellapsed) => {
        console.log(`ellapsed ${ellapsed}`);
        timingArray.push(ellapsed);
        updateRequestsCallback();
      });
    start = performance.now();
  }
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

function getTimingSamples(usePerformanceApi) {
  createTestUser(1); // TODO: Check if user exist already
  const timingSamples = 200;
  const delayBetweenRequests = 5;
  let doneRequests = 0;
  let timingExistingUser = [];
  let timingInvalidUser = [];
  let existingUserAvg = 0;
  let invalidUserAvg = 0;
  let passwords = new Array(timingSamples).fill("").map(() => {
    return randomPass(30);
  });

  let waitRequestsCompletion;
  const checkRequestsCompleted = () => {
    // This function will run from time to time to verify when
    // all requests are done (as they append to the array when
    // finished and timingSamples is total requests amount
    doneRequests += 1;
    if (doneRequests < timingSamples) {
      return;
    }
    if (usePerformanceApi) {
      const entries = getPerformance();

      if (entries.length < timingSamples) {
        if (!waitRequestsCompletion) {
          waitRequestsCompletion = setInterval(checkRequestsCompleted, 1000);
          console.log(`len: ${entries.length}`); // XXX
        }
        return;
      } // else
      doneRequests = 0;
      if (waitRequestsCompletion) {
        clearInterval(waitRequestsCompletion);
      }

      if (!existingUserAvg) {
        existingUserAvg = returnAvg(entries, timingSamples);
      } else {
        invalidUserAvg = returnAvg(entries.slice(timingSamples), timingSamples);
      }
    } else {
      if (!existingUserAvg) {
        existingUserAvg = returnAvg(timingExistingUser, timingSamples);
      } else {
        invalidUserAvg = returnAvg(timingInvalidUser, timingSamples);
      }
    }
    if (existingUserAvg && invalidUserAvg) {
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
        sendApiLogin(
          user,
          passwords[i],
          usePerformanceApi,
          checkRequestsCompleted,
          storeTiming
        );
      });
      firingInterval += delayBetweenRequests;
    }
  };

  //TODO check performance support
  initPerformance();

  fire("tom.mharres@gmail.com", timingExistingUser);

  // Wait until all previous requests are given time to finish
  //TODO: if done requests == 0
  sleep(delayBetweenRequests * timingSamples).then(() => {
    fire("invalidUser@1337", timingInvalidUser);
  });
}
