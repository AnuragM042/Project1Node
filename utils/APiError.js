class ApiError extends Error {
  constructor(
    statusCode, // numerical HTTP status code error 
    message = "something went wrong",
    errors = [],  // array that can store multiple errors 
    stack = ""  // string that contains stack trace (report of functions)
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (message) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export {ApiError}


