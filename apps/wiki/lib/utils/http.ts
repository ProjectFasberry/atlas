import ky from 'ky';

/**
 * One ky instance for outgoing requests: timeouts, retries and the user agent in a
 * single place. The app talks to the Fasberry api through it.
 */
export const http = ky.create({
  timeout: 5000,
  retry: 0,
  headers: { 'user-agent': 'fasberry-wiki' },
});
