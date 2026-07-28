/** @type {import('../../libs/shared/registry/module-registry').AppModule} */
module.exports = {
  name: 'identity',
  registerRoutes(app) {
    const authRoutes = require('../../apps/inkwell-api/src/routes/auth.routes');
    const userRoutes = require('../../apps/inkwell-api/src/routes/user.routes');
    const { authLimiter } = require('../../apps/inkwell-api/src/middlewares/rateLimiter');
    app.use('/api/auth', authLimiter, authRoutes);
    app.use('/api/users', userRoutes);
  },
};
