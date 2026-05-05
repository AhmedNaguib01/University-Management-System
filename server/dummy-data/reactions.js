const reactions = [
  {
    _id: 1,
    postId: 1,
    senderId: 4,
    type: "like",
    createdAt: new Date("2024-09-01T12:00:00"),
  },
  {
    _id: 2,
    postId: 1,
    senderId: 6,
    type: "love",
    createdAt: new Date("2024-09-01T13:00:00"),
  },
  {
    _id: 3,
    postId: 1,
    senderId: 8,
    type: "like",
    createdAt: new Date("2024-09-01T14:00:00"),
  },
  {
    _id: 4,
    postId: 3,
    senderId: 7,
    type: "like",
    createdAt: new Date("2024-09-05T16:00:00"),
  },
  {
    _id: 5,
    postId: 5,
    senderId: 4,
    type: "love",
    createdAt: new Date("2024-10-05T15:00:00"),
  },
  {
    _id: 6,
    postId: 5,
    senderId: 6,
    type: "love",
    createdAt: new Date("2024-10-05T16:00:00"),
  },
  {
    _id: 7,
    postId: 7,
    senderId: 5,
    type: "shocked",
    createdAt: new Date("2024-10-10T11:00:00"),
  },
  {
    _id: 8,
    postId: 7,
    senderId: 9,
    type: "love",
    createdAt: new Date("2024-10-10T12:00:00"),
  },
  {
    _id: 9,
    postId: 8,
    senderId: 5,
    type: "like",
    createdAt: new Date("2024-10-12T14:00:00"),
  },
  {
    _id: 10,
    postId: 2,
    senderId: 8,
    type: "laugh",
    createdAt: new Date("2024-09-10T16:00:00"),
  },
];

module.exports = reactions;
