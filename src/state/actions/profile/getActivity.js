import ThreeBoxActivity from '3box-activity';
import Web3 from 'web3';

import {
  store,
} from '../../store';
import {
  getContract,
  imageElFor,
  updateFeed,
  addDataType,
  addPublicOrPrivateDataType,
  getAuthorsLatestPost,
} from '../../../utils/funcs';
import getPublicProfile from './getPublicProfile';

const getActivity = otherProfileAddress => async (dispatch) => {
  try {
    const {
      currentWallet
    } = store.getState().userState;
    const isWalletConnect = currentWallet === 'WalletConnect';
    const reduxWeb3 = store.getState().userState.web3Obj;
    const web3Obj = isWalletConnect ? Web3 : reduxWeb3 || Web3;

    if (otherProfileAddress) {
      dispatch({
        type: 'UI_FEED_OTHER_LOADING',
        isFetchingOtherActivity: true,
      });
    } else {
      dispatch({
        type: 'UI_FEED_LOADING',
        isFetchingActivity: true,
      });
    }
    console.log('2')

    // get Eth network activity
    let activity;
    if (store.getState().userState.currentNetwork) {
      activity = await ThreeBoxActivity.get(
        otherProfileAddress || store.getState().userState.currentAddress,
        store.getState().userState.currentNetwork.toLowerCase(),
      );
    } else {
      activity = await ThreeBoxActivity.get(
        otherProfileAddress || store.getState().userState.currentAddress,
      );
    }
    console.log('3')

    // add datatype to each row
    const categorizedActivity = addDataType(activity);
    console.log('4')

    // sort and merge feed
    let feed;
    let emailProof;
    if (otherProfileAddress) {
      feed = categorizedActivity.internal
        .concat(categorizedActivity.txs)
        .concat(categorizedActivity.token);
    } else {
      // get 3box logs
      let unFilteredPublicActivity;
      let privateActivity;

      try {
        unFilteredPublicActivity = await store.getState().myData.box.public.log;
      } catch (error) {
        console.error(error);
      }

      try {
        privateActivity = await store.getState().myData.box.private.log;
      } catch (error) {
        console.error(error);
      }

      emailProof = await store.getState().myData.box.private._genDbKey('proof_email');

      // remove ethereum_proof & proof_did & memberSince
      const publicActivity = unFilteredPublicActivity
        .filter(item => (item.key !== 'ethereum_proof' &&
          item.key !== 'proof_did' &&
          item.key !== 'collectiblesFavorites' &&
          item.key !== 'memberSince'));

      // assign public or private data type
      const categorizedPublicActivity = addPublicOrPrivateDataType(publicActivity, 'Public');
      const categorizedPrivateActivity = privateActivity ? addPublicOrPrivateDataType(privateActivity, 'Private') : [];

      const spacesData = store.getState().spaces.allData;
      const spacesDataActivity = [];

      Object.entries(spacesData).forEach((space) => {
        const spaceName = space[0];

        if (spaceName !== '3Box_app') {
          Object.entries(space[1].private).forEach((keyValue) => {
            if (keyValue[0] !== 'private_space_data') {
              const spaceToActivityItem = {
                dataType: 'Private',
                key: keyValue[0],
                timeStamp: keyValue[1].timestamp ? keyValue[1].timestamp.toString().substring(0, 10) : '',
                value: keyValue[1].value,
                spaceName,
              };
              spacesDataActivity.push(spaceToActivityItem);
            }
          });

          Object.entries(space[1].public).forEach((keyValue) => {
            const valueObject = keyValue[1];
            let {
              value,
            } = valueObject;
            const isArray = Array.isArray(valueObject);

            if (isArray && valueObject.length === 0) return;

            const usersDID = store.getState().myData.did;
            const latestPost = (valueObject[0] && valueObject[0].message) && getAuthorsLatestPost(valueObject, usersDID);

            let timeStamp;

            if (latestPost) {
              // if object is a thread
              timeStamp = latestPost.timestamp;
            } else {
              timeStamp = valueObject.timestamp || '';
            }

            let arrayValue = '';

            if (isArray && valueObject.length > 0) {
              arrayValue = valueObject[0].message ? latestPost.message : valueObject[0];
            } else if (value === 'object' && !isArray) {
              [value] = Object.keys(value);
            }

            const spaceToActivityItem = {
              dataType: 'Public',
              key: keyValue[0],
              timeStamp,
              value: isArray ? arrayValue : value,
              spaceName,
            };

            spacesDataActivity.push(spaceToActivityItem);
          });
        }
      });

      feed = categorizedActivity.internal
        .concat(categorizedActivity.txs)
        .concat(categorizedActivity.token)
        .concat(categorizedPublicActivity)
        .concat(categorizedPrivateActivity)
        .concat(spacesDataActivity);
    }
    console.log('5')

    // if timestamp is undefined, give it the timestamp of the previous entry
    feed.map((item, i) => {
      const feedItem = item;
      if (!feedItem.timeStamp) {
        const deletedTime = parseInt(feed[i - 1].timeStamp, 10) + 1;
        feedItem.timeStamp = deletedTime.toString();
      }
      if (!otherProfileAddress && feedItem.key === emailProof) feedItem.key = 'proof_email';
      return feedItem;
    });
    console.log('6')

    // order feed chronologically
    feed.sort((a, b) => b.timeStamp - a.timeStamp);
    console.log('7')

    // order feed by address
    const feedByAddress = [];
    feed.forEach((item) => {
      let othersAddress;

      // check if to or from is counterparty's address
      if (otherProfileAddress) {
        othersAddress = item.from.toLowerCase() ===
          store.getState().otherProfile.otherProfileAddress.toLowerCase() ?
          item.to :
          item.from;
      } else {
        othersAddress = (item.from && item.from.toLowerCase()) ===
          store.getState().userState.currentAddress.toLowerCase() ?
          item.to :
          item.from;
      }

      // group feed by 3box or counterparty address activity
      if (feedByAddress.length > 0 &&
        Object.keys(feedByAddress[feedByAddress.length - 1])[0] === othersAddress) {
        feedByAddress[feedByAddress.length - 1][othersAddress].push(item);
      } else if (feedByAddress.length > 0 && Object.keys(feedByAddress[feedByAddress.length - 1])[0] === 'threeBox' && !item.spaceName && (item.dataType === 'Public' || item.dataType === 'Private')) {
        feedByAddress[feedByAddress.length - 1].threeBox.push(item);
      } else if (feedByAddress.length > 0 && Object.keys(feedByAddress[feedByAddress.length - 1])[0] === item.spaceName) {
        feedByAddress[feedByAddress.length - 1][item.spaceName].push(item);
      } else if (item.spaceName) {
        feedByAddress.push({
          [item.spaceName]: [item],
        });
      } else if ((item.dataType === 'Public' || item.dataType === 'Private') && !item.spaceName) {
        feedByAddress.push({
          threeBox: [item],
        });
      } else {
        feedByAddress.push({
          [othersAddress]: [item],
        });
      }
    });

    console.log('8')
    const checkedAddresses = {};
    const addressData = {};
    const isContract = {};
    let counter = 0;

    // if there is no feed length, move on to next step
    if (feedByAddress.length === 0) updateFeed(otherProfileAddress, feedByAddress, addressData, isContract);
    console.log('9')

    // get contract and 3box profile metadata
    await feedByAddress.map(async (txGroup) => {
      const otherAddress = Object.keys(txGroup)[0];
      let metaData = {};
      let contractData;
      let contractArray = [];
      let name;
      let image;
      console.log('10', otherAddress)

      if (otherAddress === 'threeBox') {
        counter += 1;
        if (counter === feedByAddress.length) updateFeed(otherProfileAddress, feedByAddress, addressData, isContract);
        return;
      }

      if (!checkedAddresses[otherAddress]) {
        checkedAddresses[otherAddress] = true;
        try {
          console.log('11', web3Obj.eth.getCode)
          web3Obj.eth.getCode(otherAddress, (err, code) => {
            console.log('12')
            if (err) {
              addressData[otherAddress] = false;
              counter += 1;
              if (counter === feedByAddress.length) updateFeed(otherProfileAddress, feedByAddress, addressData, isContract);
              return console.error(err);
            }

            if (code !== '0x' && typeof code !== 'undefined') { // then address is contract
              isContract[otherAddress] = true;
              getContract(otherAddress)
                .then((data) => {
                  console.log('13')
                  if (data.status === '1') {
                    contractData = JSON.parse(data.result);
                    contractArray = imageElFor(otherAddress);
                    addressData[otherAddress] = {
                      contractImg: contractArray[0],
                      contractDetails: contractArray[1],
                      contractData,
                    };
                    counter += 1;
                  } else {
                    addressData[otherAddress] = false;
                    counter += 1;
                  }
                  if (counter === feedByAddress.length) updateFeed(otherProfileAddress, feedByAddress, addressData, isContract);
                })
                .catch((error) => {
                  addressData[otherAddress] = false;
                  counter += 1;
                  if (counter === feedByAddress.length) updateFeed(otherProfileAddress, feedByAddress, addressData, isContract);
                  return console.log(error);
                });
            } else { // look for 3box metadata
              const graphqlQueryObject = `
                {
                  profile(id: "${otherAddress}") {
                    name
                    image
                  }
                }
                `;
              getPublicProfile(graphqlQueryObject).then((profile) => {
                console.log('14')
                metaData = profile;
                name = metaData && metaData.profile && metaData.profile.name;
                image = metaData && metaData.profile && metaData.profile.image;
                addressData[otherAddress] = {
                  name,
                  image,
                };
                counter += 1;
                if (counter === feedByAddress.length) updateFeed(otherProfileAddress, feedByAddress, addressData, isContract);
              }).catch((error) => {
                addressData[otherAddress] = false;
                counter += 1;
                if (counter === feedByAddress.length) updateFeed(otherProfileAddress, feedByAddress, addressData, isContract);
                return console.error(error);
              });
            }
          });
        } catch (err) {
          console.error(err);
          addressData[otherAddress] = false;
          counter += 1;
          if (counter === feedByAddress.length) updateFeed(otherProfileAddress, feedByAddress, addressData, isContract);
        }
      } else {
        counter += 1;
        if (counter === feedByAddress.length) updateFeed(otherProfileAddress, feedByAddress, addressData, isContract);
      }
    });
  } catch (err) {
    dispatch({
      type: 'UI_FEED_FAILED',
      isFetchingActivity: false,
      errorMessage: err,
      provideConsent: false,
    });
    dispatch({
      type: 'MY_FEED_UPDATE',
      feedByAddress: [],
    });
  }
};

export default getActivity;