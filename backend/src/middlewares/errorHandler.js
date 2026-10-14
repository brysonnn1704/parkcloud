function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.url} - ${err.message}`, err.stack);

  // PostgreSQL Concurrency / Exclusion Constraint Violation (Double-Booking Conflict)
  if (err.code === '23P01') {
    return res.status(409).json({
      success: false,
      error: 'Slot conflict: This parking slot is already booked for the selected time window. Please choose another slot or time.',
      code: 'SLOT_TIME_CONFLICT',
    });
  }

  // PostgreSQL Unique Constraint Violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry: A record with these details already exists.',
      detail: err.detail,
    });
  }

  // PostgreSQL Check Constraint Violation
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      error: 'Invalid data constraint. Please verify your inputs (e.g. end time must be after start time).',
    });
  }

  // Zod Validation Error
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'An internal server error occurred. Please try again.',
    code: err.code,
  });
}

module.exports = { errorHandler };
