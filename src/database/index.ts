import { AdminAction } from './entities/admin-action.entity';
import { Auction } from './entities/auction.entity';
import { AuthSession } from './entities/auth-session.entity';
import { Bid } from './entities/bid.entity';
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
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { User } from './entities/user.entity';
import { VerificationRequest } from './entities/verification-request.entity';
import { Wallet } from './entities/wallet.entity';
import { KCTransaction } from './entities/kc-transaction.entity';
import { KCSetting } from './entities/kc-setting.entity';
import { Referral } from './entities/referral.entity';

export const AllEntities = [
  AdminAction,
  Auction,
  AuthSession,
  Bid,
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
  SubscriptionPlan,
  User,
  VerificationRequest,
  Wallet,
  KCTransaction,
  KCSetting,
  Referral,
];

export const CustomRepository = [

];
