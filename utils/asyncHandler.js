// const asyncHandler = () =>{}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () =>{}
// Explanation **************************************************

// *********************************************************************************
// Wrapper function with Try- Catch block

// HOF
// const asyncHandler = (fn) => async (req,res,next) =>{
//   try {
//     await fn(req,res,next)
//   } catch (error) {
//     res.status(err.code || 500).json({
//         success: false,  // for frontend devs
//         message: err.message
//     })
//   }  search node.js api error online for more details in errors
// }****************************************************************************
//

// Wrapper function with Promise HOF
const asyncHandler = (reqHandler) => {
  return (req, res, next) => {
    // imp give return statement as it will give error in route.js
    Promise.resolve(reqHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
