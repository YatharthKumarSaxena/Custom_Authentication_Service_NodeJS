const { AuthLogModel } = require("./auth-logs.model");
const { DeviceModel } = require("./device.model");
const { VerificationLinkModel } = require("./link.model");
const { OTPModel } = require("./otp.model");
const { UserModel } = require("./user.model");
const { UserDeviceModel } = require("./user-device.model");
const { CounterModel } = require("./id-generator.model");
const { SystemLogModel } = require("./system-log.model");

const models = {
    AuthLogModel,
    DeviceModel,
    VerificationLinkModel,
    OTPModel,
    UserModel,
    UserDeviceModel,
    CounterModel,
    SystemLogModel
}

module.exports = {
    ...models
};