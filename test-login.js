const handler = require('./api/login.js');
const req = { method: 'POST', body: { email: 'test@example.com', password: 'password123' } };
const res = {
  status: function(code) { console.log('STATUS:', code); return this; },
  json: function(data) { console.log('JSON:', data); return this; },
  end: function() { console.log('END'); }
};
handler(req, res).catch(console.error);
