import { AdminAction } from './entities/admin-action.entity';
import { AuthSession } from './entities/auth-session.entity';
import { Category } from './entities/category.entity';
import { Collaboration } from './entities/collaboration.entity';
import { Conversation } from './entities/conversation.entity';
import { InfluencerProfile } from './entities/influencer-profile.entity';
import { InfluencerRanking } from './entities/influencer-ranking.entity';
import { InfluencerSearchIndex } from './entities/influencer-search-index.entity';
import { Message } from './entities/message.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { Profile } from './entities/profile.entity';
import { Report } from './entities/report.entity';
import { Review } from './entities/review.entity';
import { SocialPlatform } from './entities/social-platform.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { User } from './entities/user.entity';
import { VerificationRequest } from './entities/verification-request.entity';

export const AllEntities = [
  AdminAction,
  AuthSession,
  Category,
  Collaboration,
  Conversation,
  InfluencerProfile,
  InfluencerRanking,
  InfluencerSearchIndex,
  Message,
  PasswordReset,
  Profile,
  Report,
  Review,
  SocialPlatform,
  SubscriptionPlan,
  User,
  VerificationRequest,
];

export const CustomRepository = [

];
