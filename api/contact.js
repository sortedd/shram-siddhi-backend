const app = require('./server');

module.exports = async (req, res) => {
  // Create a mock request and response to pass to our Express route handler
  const mockReq = { ...req };
  const mockRes = {
    statusCode: 200,
    headers: {},
    body: '',
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = JSON.stringify(data);
      res.status(this.statusCode).json(data);
    },
    send: function(data) {
      this.body = typeof data === 'string' ? data : JSON.stringify(data);
      res.status(this.statusCode).send(data);
    },
    setHeader: function(name, value) {
      this.headers[name] = value;
      res.setHeader(name, value);
      return this;
    }
  };

  // Call the actual Express route handler
  app._router.handle(mockReq, mockRes, () => {});
};
