import {
  store,
} from '../../store';
import { fetchCommenters } from './helpers';
import {
  followingSpaceName,
  myProfileWall,
} from '../../../utils/constants';

const updateMyWall = async () => {
  const wallThread = await store.getState().myData.wallThread;
  const wallPosts = await wallThread.getPosts();
  store.dispatch({
    type: 'MY_WALL_POSTS_UPDATE',
    wallPosts,
  });
};

const getMyWall = () => async (dispatch) => {
  try {
    const box = await store.getState().myData.box;
    const space = await box.openSpace(followingSpaceName);
    const myAddress = store.getState().userState.currentAddress;
    const opts = {
      firstModerator: myAddress,
    };
    const wallThread = await space.joinThread(myProfileWall, opts);
    const wallPosts = await wallThread.getPosts();
    const uniqueUsers = [...new Set(wallPosts.map((x) => x.author))];

    const wallProfiles = await fetchCommenters(uniqueUsers);

    wallThread.onUpdate(() => updateMyWall());

    dispatch({
      type: 'MY_WALL_UPDATE',
      wallPosts,
      wallThread,
      wallProfiles,
    });

    dispatch({
      type: 'UI_WALL_LOADING',
      isFetchingWall: false,
    });
  } catch (error) {
    console.error(error);
  }
};

export default getMyWall;