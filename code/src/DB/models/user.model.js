import mongoose from "mongoose";
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "../../common/enums/index.js";
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: [3, "First name cannot be less than 3 characters"],
      maxLength: [20, "First name cannot be more than 20 characters"],
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      minLength: [3, "Last name cannot be less than 3 characters"],
      maxLength: [20, "Last name cannot be more than 20 characters"],
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider == ProviderEnum.System;
      },
    },
    phone: {
      type: String,
      required: function () {
        return this.provider == ProviderEnum.System;
      },
    },
    gender: {
      type: Number,
      enum: Object.values(GenderEnum),
      default: GenderEnum.Male,
    },
    provider: {
      type: Number,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.System,
    },
    role: {
      type: Number,
      enum: Object.values(RoleEnum),
      default: RoleEnum.User,
    },
    oldPassword: [String],
    coverProfilePicture: [
      {
        type: String,
      },
    ],
    address: {
      type: String,
      trim: true,
    },
    deletedAt: { type: Date, default: null },
    profilePicture: {
      type: String,
    },
    confirmEmail: {
      type: Date,
    },
    changeCredentialTime: {
      type: Date,
    },
  },
  {
    collection: "Users",
    timestamps: true,
    strict: true,
    strictQuery: true,
    optimisticConcurrency: true,
    autoIndex: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);
userSchema
  .virtual("username")
  .set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName });
  })
  .get(function () {
    return this.firstName + " " + this.lastName;
  });
export const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);