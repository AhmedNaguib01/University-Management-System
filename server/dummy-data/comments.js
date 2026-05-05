const comments = [
  {
    _id: "1",
    postId: "2",
    sender: { id: "1", name: "Dr. Ahmed Hassan", image: {} },
    body: "Great question Omar! The base case is the condition that stops the recursion. Think of it as the simplest version of the problem that you can solve directly without further recursion.",
    createdAt: new Date("2024-09-10T14:30:00"),
  },
  {
    _id: "2",
    postId: "2",
    sender: { id: "4", name: "Omar Khaled", image: {} },
    body: "Thank you Dr. Hassan! That makes much more sense now. So for factorial, the base case would be when n equals 0 or 1?",
    createdAt: new Date("2024-09-10T15:00:00"),
  },
  {
    _id: "3",
    postId: "2",
    sender: { id: "1", name: "Dr. Ahmed Hassan", image: {} },
    body: "Exactly! You've got it. factorial(0) = 1 and factorial(1) = 1 are your base cases.",
    createdAt: new Date("2024-09-10T15:15:00"),
  },
  {
    _id: "4",
    postId: "4",
    sender: { id: "5", name: "Fatima Ali", image: {} },
    body: "I'm interested! I can help with the normalization topics. When are you thinking of meeting?",
    createdAt: new Date("2024-10-01T16:00:00"),
  },
  {
    _id: "5",
    postId: "4",
    sender: { id: "7", name: "Nour Ahmed", image: {} },
    body: "How about Saturday at 2 PM? We can use the study room in the library.",
    createdAt: new Date("2024-10-01T17:00:00"),
  },
  {
    _id: "6",
    postId: "6",
    sender: { id: "9", name: "Layla Mahmoud", image: {} },
    body: "Factory creates objects of a single type, while Abstract Factory creates families of related objects. Think of Factory as a single factory, and Abstract Factory as a factory of factories!",
    createdAt: new Date("2024-10-08T10:30:00"),
  },
  {
    _id: "7",
    postId: "9",
    sender: { id: "10", name: "Dr. Karim Nasser", image: {} },
    body: "Both are excellent choices! React Native is great if you already know JavaScript/React. Flutter has better performance and a more consistent UI across platforms. For this course, I recommend React Native since we've covered React.",
    createdAt: new Date("2024-10-15T11:00:00"),
  },
  {
    _id: "8",
    postId: "9",
    sender: { id: "6", name: "Youssef Ibrahim", image: {} },
    body: "Thanks Dr. Nasser! I'll go with React Native then. Any recommended tutorials?",
    createdAt: new Date("2024-10-15T12:00:00"),
  },
  {
    _id: "9",
    postId: "5",
    sender: { id: "4", name: "Omar Khaled", image: {} },
    body: "This sounds amazing! Will we need to bring our own laptops?",
    createdAt: new Date("2024-10-05T14:00:00"),
  },
  {
    _id: "10",
    postId: "5",
    sender: { id: "10", name: "Dr. Karim Nasser", image: {} },
    body: "Yes, please bring your laptops with Node.js and VS Code installed. I'll send setup instructions before the workshop.",
    createdAt: new Date("2024-10-05T15:00:00"),
  },
];

module.exports = comments;
