/** @type {import('../../libs/shared/registry/module-registry').AppModule} */
module.exports = {
  name: 'identity',
  registerRoutes(app) {
    const authRoutes = require('../../apps/inkwell-api/src/routes/auth.routes');
    const userRoutes = require('../../apps/inkwell-api/src/routes/user.routes');
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
  },
};
