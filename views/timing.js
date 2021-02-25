/* eslint-env browser */

function checkSupport() {
  // Check for performance API support, needs at least one resource
  if (performance === undefined) {
    return false;
  }
  if (typeof performance.clearResourceTimings != "function") {
    // we want to clear timings before starting measurements
    return false;
  }

  const entries = performance.getEntriesByType("resource");
  if (!entries.length) {
    return false;
  }

  const entry = entries[0];
  if (!(entry instanceof PerformanceResourceTiming)) {
    return false;
  }

  if (!PerformanceResourceTiming.prototype) {
    return false;
  }

  // from eslint docs: You may want to turn this rule off if
  // your code only touches objects with hardcoded keys
  const requiresOne = (depends) => {
    return depends.some((dependency) => {
      // eslint-disable-next-line no-prototype-builtins
      if (PerformanceResourceTiming.prototype.hasOwnProperty(dependency)) {
        return true;
      }
    });
  };

  // any of these can be used to get time calculation
  if (
    !requiresOne([
      "connectEnd",
      "connectStart",
      "domainLookupEnd",
      "domainLookupStart",
      "fetchStart",
      "startTime",
      "duration",
    ])
  ) {
    return false;
  }
  if (!requiresOne(["responseStart", "responseEnd", "duration"])) {
    return false;
  }
  return true;
}

function initPerformance() {
  // Create a getter which will inherit from PerformanceResourceTiming
  if (
    // setting the prototype twice is erratic, verify if not set
    !Object.getOwnPropertyDescriptor(
      PerformanceResourceTiming.prototype,
      "getSystemLoadTime"
    )
  ) {
    Object.defineProperties(PerformanceResourceTiming.prototype, {
      getSystemLoadTime: {
        get: function () {
          let [start, end] = [0, 0];

          if (this.connectEnd) start = this.connectStart;
          else if (this.connectStart) start = this.connectStart;
          else if (this.domainLookupEnd) start = this.domainLookupEnd;
          else if (this.domainLookupStart) start = this.domainLookupEnd;
          else if (this.fetchStart) start = this.fetchStart;
          else if (this.startTime) start = this.startTime;
          else if (this.duration) return this.duration;

          if (this.responseStart) end = this.responseStart;
          else if (this.responseEnd) end = this.responseEnd;

          return end - start;
        },
      },
    });
  }
  performance.clearResourceTimings();
}

function getPerformanceEntries(amount) {
  const entries = new Array(amount);
  performance.getEntriesByType("resource").some((request, i) => {
    if (i < amount) {
      entries[i] = request.getSystemLoadTime;
    } else {
      return;
    }
  });
  performance.clearResourceTimings();
  return entries;
}
