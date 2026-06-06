import { useNavigate } from 'react-router-dom';
import { COMMUNITIES } from '../../utils/constants';
import { joinCommunity, leaveCommunity } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import CommunityCard from './CommunityCard';

export default function CommunityList() {
  const navigate = useNavigate();
  const { user, userProfile, refreshProfile } = useAuth();
  const { addToast } = useApp();

  const joinedCommunities = userProfile?.communities || [];

  const handleJoin = async (communityId) => {
    if (!user) return;
    const isJoined = joinedCommunities.includes(communityId);
    try {
      if (isJoined) {
        await leaveCommunity(user.uid, communityId);
        addToast('Left community', 'info');
      } else {
        await joinCommunity(user.uid, communityId);
        addToast('Joined! 🎉', 'success');
      }
      await refreshProfile();
    } catch (err) {
      console.error(err);
      addToast('Something went wrong', 'error');
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {COMMUNITIES.map(community => (
        <CommunityCard
          key={community.id}
          community={community}
          joined={joinedCommunities.includes(community.id)}
          onJoin={() => handleJoin(community.id)}
          onView={() => navigate(`/community/${community.id}`)}
        />
      ))}
    </div>
  );
}
