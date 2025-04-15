// Format error messages in a user-friendly way
exports.errorHandler = (error) => {
  let message = 'An unexpected error occurred';
  
  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    message = errors.join(', ');
  } 
  // Handle duplicate key errors
  else if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  } 
  // Handle cast errors (e.g., invalid MongoDB ObjectId)
  else if (error.name === 'CastError') {
    message = `Invalid ${error.path}: ${error.value}`;
  } 
  // Handle other specific error types
  else if (error.message) {
    message = error.message;
  }
  
  return message;
}; 