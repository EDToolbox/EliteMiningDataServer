const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema({
  providerName: { type: String, required: true },
  providerId: { type: String, required: true },
  accessToken: { type: String },
  refreshToken: { type: String },
  profile: { type: mongoose.Schema.Types.Mixed },
});

const UserSchema = new mongoose.Schema(
  {
    username: { type: String },
    displayName: { type: String },
    email: { type: String },
    providers: [ProviderSchema],
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    miningReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MiningReport' }],
  },
  { strict: false }
);

UserSchema.methods.linkProvider = async function (providerObj) {
  // providerObj: { providerName, providerId, accessToken, refreshToken, profile }
  const existing = this.providers.find(
    (p) => p.providerName === providerObj.providerName && p.providerId === providerObj.providerId
  );
  if (!existing) {
    this.providers.push(providerObj);
  } else {
    existing.accessToken = providerObj.accessToken || existing.accessToken;
    existing.refreshToken = providerObj.refreshToken || existing.refreshToken;
    existing.profile = providerObj.profile || existing.profile;
  }
  await this.save();
  return this;
};

module.exports = mongoose.model('User', UserSchema);
