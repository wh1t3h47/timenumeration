/* eslint-env browser */

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
  useResourcesApi,
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

  if (useResourcesApi) {
    fetch(...requestParams).then(() => {
      updateRequestsCallback();
    });
  } else {
    // start will be calculated in the end (to be more precise)
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

function getTimingSamples(useResourcesApi) {
  createTestUser(1); // TODO: Check if user exist already

  const timingSamples = 20;
  const delayBetweenRequests = 5 + !useResourcesApi * 50;
  let doneRequests = 0;
  let timingExistingUser = [];
  let timingInvalidUser = [];
  let existingUserAvg = 0;
  let invalidUserAvg = 0;
  let passwords = new Array(timingSamples).fill("").map(() => {
    return randomPass(30);
  });

  const checkRequestsCompleted = () => {
    // This function will run from time to time to verify when
    // all requests are done (as they append to the array when
    // finished and timingSamples is total requests amount
    doneRequests += 1;
    // console.log(doneRequests);
    if (doneRequests < timingSamples) {
      return;
    }

    const prepareNextExecution = () => {
      // reset global stuff used by this function
      doneRequests = 0;
    };

    if (useResourcesApi) {
      const entries = getPerformanceEntries(timingSamples);

      if (!existingUserAvg) {
        // batch of requests for existingUser done
        console.log(entries);
        existingUserAvg = returnAvg(entries, timingSamples);
        prepareNextExecution();
        return;
      } else {
        // batch of requests for invalidUser done
        console.log(entries);
        invalidUserAvg = returnAvg(entries, timingSamples);
      }
    } else {
      // not using resources API

      if (!existingUserAvg) {
        existingUserAvg = returnAvg(timingExistingUser, timingSamples);
        prepareNextExecution();
        return;
      } else if (timingInvalidUser.length >= timingSamples) {
        invalidUserAvg = returnAvg(timingInvalidUser, timingSamples);
      }
    }

    // Will run either using resources API or not using it
    prepareNextExecution();
    const delta = existingUserAvg - invalidUserAvg;
    console.log(timingExistingUser.length);
    console.log(`timing delta = ${delta}`);
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
          useResourcesApi,
          checkRequestsCompleted,
          storeTiming
        );
      });
      firingInterval += delayBetweenRequests;
    }
  };

  // checkSupport returns false if resourcesApi is not supported
  if (useResourcesApi) { 
    useResourcesApi = checkSupport();
    if (useResourcesApi) {
      initPerformance();
    }
  }

  fire("tom.mharres@gmail.com", timingExistingUser);

  let eventTimerHandle = 0;
  const requestWaiter = (fireCallback, fireArgs) => {
    // Wait until all previous requests finish and fire callback when they do
    if (!doneRequests) return;
    fireCallback(...fireArgs);
    clearInterval(eventTimerHandle)
  };

  const params = ["invalidUser@1337", timingInvalidUser];
  setInterval();
}
