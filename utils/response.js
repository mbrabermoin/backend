// Utilidades para respuestas HTTP consistentes
const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (
  res,
  message = "Server error",
  statusCode = 500,
  error = null,
) => {
  console.error("Error:", error);
  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error : null,
  });
};

const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors,
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
};
