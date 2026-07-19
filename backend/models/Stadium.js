import mongoose from 'mongoose';

const stadiumSchema = new mongoose.Schema({
  stadiumId: { type: String, required: true, unique: true },
  name: String,
  mapImage: String,
  dimensions: {
    width: Number,
    height: Number
  },
  levels: [{
    id: String,
    name: String
  }],
  theme: {
    background: String,
    primary: String,
    accent: String
  },
  facilities: [mongoose.Schema.Types.Mixed],
  sections: [mongoose.Schema.Types.Mixed]
});

// Mongoose pluralizes model names by default: `Stadium` would resolve to
// the `stadia` collection. The database uses the explicitly named `stadium`
// collection, so keep that mapping stable across reads and seeding.
export default mongoose.model('Stadium', stadiumSchema, 'stadium');
