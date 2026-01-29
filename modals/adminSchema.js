import mongoose from "mongoose";
import bcrypt from "bcrypt";


var Schema = mongoose.Schema;
var adminSchema = new Schema({
  userName: {
    type: String,
    required: true,
  },
  password: { // lowercase
    type: String,
    required: true,
  }
});

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});




const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
