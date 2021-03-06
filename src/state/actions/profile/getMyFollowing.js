import {
  store,
} from '../../store';

import {
  getFollowingThreadAndPosts,
} from './helpers';

const getMyFollowing = async () => {
  try {
    const myAddress = store.getState().userState.currentAddress;
    await getFollowingThreadAndPosts(myAddress);
  } catch (error) {
    console.error(error);
  }
};

export default getMyFollowing;