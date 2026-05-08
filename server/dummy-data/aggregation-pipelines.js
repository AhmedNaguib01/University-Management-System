const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const Reaction = require('../models/Reaction');
const Course = require('../models/Course');

/**
 * PIPELINE 1: Top Contributors Leaderboard
 * Collection: users
 * Purpose: Rank users by their contributions (posts, comments, reactions)
 */
async function getTopContributorsLeaderboard() {
  const pipeline = [
    { $match: { role: "instructor" } },
    {
      $lookup: {
        from: "posts",
        let: { userId: "$_id" },
        pipeline: [
          { $match: { 
              $expr: { 
                $and: [
                  { $eq: ["$sender.id", "$$userId"] },
                  { $in: ["$type", ["discussion", "questions"]] }
                ]
              }
          } }
        ],
        as: "userPosts"
      }
    },
    {
      $addFields: {
        posts_count: { $size: "$userPosts" },
        postIds: "$userPosts._id"
      }
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "sender.id",
        as: "userComments"
      }
    },
    { $addFields: { comments_count: { $size: "$userComments" } } },
    {
      $lookup: {
        from: "reactions",
        localField: "_id",
        foreignField: "senderId",
        as: "userReactions"
      }
    },
    { $addFields: { reactions_count: { $size: "$userReactions" } } },

    {
      $lookup: {
        from: "comments",
        let: { postIds: "$postIds" },
        pipeline: [
          { $match: { $expr: { $in: ["$postId", "$$postIds"] } } }
        ],
        as: "commentsOnPosts"
      }
    },
    { $addFields: { comments_on_posts_count: { $size: "$commentsOnPosts" } } },

    {
      $lookup: {
        from: "reactions",
        let: { postIds: "$postIds" },
        pipeline: [
          { $match: { $expr: { $in: ["$postId", "$$postIds"] } } }
        ],
        as: "reactionsOnPosts"
      }
    },
    { $addFields: { reactions_on_posts_count: { $size: "$reactionsOnPosts" } } },

    {
      $addFields: {
        score: {
          $add: [
            { $multiply: ["$posts_count", 3] },
            { $multiply: ["$comments_count", 2] },
            { $multiply: ["$reactions_count", 1] },
            { $multiply: ["$comments_on_posts_count", 2] },
            { $multiply: ["$reactions_on_posts_count", 1] }
          ]
        }
      }
    },

    { $sort: { score: -1 } },
    { $limit: 5 },
    
    {
      $project: {
        name: 1,
        posts_count: 1,
        comments_count: 1,
        reactions_count: 1,
        comments_on_posts_count: 1,
        reactions_on_posts_count: 1,
        score: 1
      }
    }
  ];

  const topContributors = await User.aggregate(pipeline);
  return topContributors;
}

/**
 * PIPELINE 2: Course Engagement Analytics
 * Collection: posts
 * Purpose: Analyze engagement metrics per course (posts, comments, reactions)
 */
async function getCourseEngagementAnalytics() {
  const pipeline = [
    {
      $group: {
        _id: "$courseId",
        totalPosts: { $sum: 1 },
        announcements: {
          $sum: { $cond: [{ $eq: ["$type", "announcement"] }, 1, 0] }
        },
        questions: {
          $sum: { $cond: [{ $eq: ["$type", "question"] }, 1, 0] }
        },
        discussions: {
          $sum: { $cond: [{ $eq: ["$type", "discussion"] }, 1, 0] }
        },
        postIds: { $push: "$_id" },
        uniqueContributors: { $addToSet: "$sender.id" }
      }
    },
    {
      $lookup: {
        from: "comments",
        localField: "postIds",
        foreignField: "postId",
        as: "comments"
      }
    },
    {
      $lookup: {
        from: "reactions",
        localField: "postIds",
        foreignField: "postId",
        as: "reactions"
      }
    },
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "courseInfo"
      }
    },
    {
      $unwind: {
        path: "$courseInfo",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        courseId: "$_id",
        courseName: { $ifNull: ["$courseInfo.name", "General/Unknown"] },
        enrolled: { $ifNull: ["$courseInfo.enrolled", 0] },
        totalPosts: 1,
        announcements: 1,
        questions: 1,
        discussions: 1,
        totalComments: { $size: "$comments" },
        totalReactions: { $size: "$reactions" },
        uniqueContributors: { $size: "$uniqueContributors" },
        engagementScore: {
          $add: [
            { $multiply: ["$totalPosts", 3] },
            { $multiply: [{ $size: "$comments" }, 2] },
            { $size: "$reactions" }
          ]
        },
        avgCommentsPerPost: {
          $cond: [
            { $eq: ["$totalPosts", 0] },
            0,
            { $round: [{ $divide: [{ $size: "$comments" }, "$totalPosts"] }, 2] }
          ]
        }
      }
    },
    {
      $sort: { engagementScore: -1 }
    }
  ];

  const courseEngagement = await Post.aggregate(pipeline);
  return courseEngagement;
}

/**
 * PIPELINE 3: Reaction Distribution Analysis
 * Collection: reactions
 * Purpose: Analyze reaction types distribution across posts and time
 */
async function getReactionDistributionAnalysis() {
  const pipeline = [
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: "$senderId" },
        uniquePosts: { $addToSet: "$postId" }
      }
    },
    {
      $lookup: {
        from: "posts",
        localField: "uniquePosts",
        foreignField: "_id",
        as: "postDetails"
      }
    },
    {
      $project: {
        reactionType: "$_id",
        totalCount: "$count",
        uniqueUsersCount: { $size: "$uniqueUsers" },
        uniquePostsCount: { $size: "$uniquePosts" },
        coursesReached: {
          $size: {
            $setUnion: {
              $map: {
                input: "$postDetails",
                as: "post",
                in: "$$post.courseId"
              }
            }
          }
        },
        avgReactionsPerUser: {
          $round: [
            { $divide: ["$count", { $size: "$uniqueUsers" }] },
            2
          ]
        }
      }
    },
    {
      $sort: { totalCount: -1 }
    },
    {
      $group: {
        _id: null,
        reactions: { $push: "$$ROOT" },
        grandTotal: { $sum: "$totalCount" }
      }
    },
    {
      $project: {
        _id: 0,
        grandTotal: 1,
        reactionBreakdown: "$reactions",
        mostPopularReaction: { $arrayElemAt: ["$reactions.reactionType", 0] }
      }
    }
  ];

  const reactionDistribution = await Reaction.aggregate(pipeline);
  return reactionDistribution;
}

/**
 * PIPELINE 4: Instructor Course Performance Report
 * Collection: courses
 * Purpose: Detailed analytics for instructor's courses with student engagement
 * @param {string} instructorId - Optional instructor ID to filter courses
 */
async function getInstructorCoursePerformanceReport(instructorId = null) {
  const pipeline = [];

  // Optional: Match courses by instructor
  if (instructorId) {
    pipeline.push({
      $match: {
        instructorId: mongoose.Types.ObjectId(instructorId)
      }
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "courseId",
        as: "coursePosts"
      }
    },
    {
      $lookup: {
        from: "comments",
        localField: "coursePosts._id",
        foreignField: "postId",
        as: "courseComments"
      }
    },
    {
      $lookup: {
        from: "reactions",
        localField: "coursePosts._id",
        foreignField: "postId",
        as: "courseReactions"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "instructorId",
        foreignField: "_id",
        as: "instructorInfo"
      }
    },
    {
      $project: {
        courseId: "$_id",
        courseName: "$name",
        description: 1,
        creditHours: 1,
        enrolled: 1,
        capacity: 1,
        instructors: {
          $map: {
            input: "$instructorInfo",
            as: "inst",
            in: { name: "$$inst.name", email: "$$inst.email" }
          }
        },
        enrollmentRate: {
          $round: [
            {
              $multiply: [
                { $divide: ["$enrolled", { $max: ["$capacity", 1] }] },
                100
              ]
            },
            1
          ]
        },
        totalPosts: { $size: "$coursePosts" },
        postsByType: {
          questions: {
            $size: {
              $filter: {
                input: "$coursePosts",
                as: "p",
                cond: { $eq: ["$$p.type", "question"] }
              }
            }
          },
          announcements: {
            $size: {
              $filter: {
                input: "$coursePosts",
                as: "p",
                cond: { $eq: ["$$p.type", "announcement"] }
              }
            }
          },
          discussions: {
            $size: {
              $filter: {
                input: "$coursePosts",
                as: "p",
                cond: { $eq: ["$$p.type", "discussion"] }
              }
            }
          }
        },
        totalComments: { $size: "$courseComments" },
        totalReactions: { $size: "$courseReactions" },
        uniqueContributors: {
          $size: {
            $setUnion: [
              { $map: { input: "$coursePosts", as: "p", in: "$$p.sender.id" } },
              { $map: { input: "$courseComments", as: "c", in: "$$c.sender.id" } }
            ]
          }
        },
        avgEngagementPerPost: {
          $cond: [
            { $eq: [{ $size: "$coursePosts" }, 0] },
            0,
            {
              $round: [
                {
                  $divide: [
                    { $add: [{ $size: "$courseComments" }, { $size: "$courseReactions" }] },
                    { $size: "$coursePosts" }
                  ]
                },
                2
              ]
            }
          ]
        }
      }
    },
    {
      $sort: { enrolled: -1 }
    }
  );

  const coursePerformance = await Course.aggregate(pipeline);
  return coursePerformance;
}

module.exports = {
  getCourseEngagementAnalytics,
  getTopContributorsLeaderboard,
  getReactionDistributionAnalysis,
  getInstructorCoursePerformanceReport
};