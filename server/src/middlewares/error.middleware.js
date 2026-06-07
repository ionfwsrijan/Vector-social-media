const errorHandler = (err, req, res, next) => {
  void next;

  const statusCode = err?.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500
      ? "Server error"
      : err.message,
  });
};

export default errorHandler;