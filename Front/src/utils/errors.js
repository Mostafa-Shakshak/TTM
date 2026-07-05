export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond.'
  if (!error?.response) return 'We could not reach TTM. Is the API server running?'
  return error.response?.data?.message || fallback
}
