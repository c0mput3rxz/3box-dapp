import React, { Component } from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import * as routes from './utils/routes';
import Landing from './views/Landing.jsx';
import Profile from './views/Profile.jsx';
import EditProfile from './views/EditProfile.jsx';
import Privacy from './views/Privacy.jsx';
import Terms from './views/Terms.jsx';
import history from './history';

import {
  SwitchedAddressModal,
  SwitchedNetworksModal,
  LoggedOutModal,
  OnBoardingModalDesktop,
  LoadingThreeBoxProfileModal,
  OnBoardingModalMobile,
  ProvideAccessModal,
  AccessDeniedModal,
} from './components/Modals.jsx';

import {
  profileGetBox,
  requestAccess,
  getPublicName,
  getPublicGithub,
  getPublicImage,
  getPrivateEmail,
  getActivity,
  checkWeb3Wallet,
  checkNetwork,
  handleSignOut,
} from './state/actions';

import {
  handleSignInModal,
  closeDifferentNetworkModal,
  proceedWithSwitchedAddressModal,
  handleAccessModal,
  handleDeniedAccessModal,
  handleLoggedOutModal,
  handleSwitchedAddressModal,
  requireMetaMaskModal,
  handleMobileWalletModal,
  handleOnboardingModal,
} from './state/actions-modals';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      onBoardingModalMobileOne: false,
      onBoardingModalMobileTwo: false,
      onBoardingModalMobileThree: false,
      width: window.innerWidth,
    }
    this.loadData = this.loadData.bind(this);
  }

  componentWillMount() {
    window.addEventListener('resize', this.handleWindowSizeChange);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange);
  }

  handleWindowSizeChange = () => {
    this.setState({ width: window.innerWidth });
  };

  async componentDidMount() {
    const { location } = this.props;
    const { pathname } = location;
    if (typeof window.web3 === 'undefined' && pathname !== '/') {
      history.push(routes.LANDING);
      this.props.requireMetaMaskModal();
      this.props.handleMobileWalletModal();
    } else if (typeof window.web3 !== 'undefined') {
      await this.props.checkWeb3Wallet();
      if (this.props.hasWallet && pathname !== '/') {
        await this.props.checkNetwork();
        this.loadData();
      }
    }
  }

  handleNextMobileModal = (thisModal, nextModal) => {
    this.setState({
      [`onBoardingModalMobile${thisModal}`]: false,
      [`onBoardingModalMobile${nextModal}`]: true
    })
  }

  async loadData() {
    const { location } = this.props;
    const { pathname } = location;

    await this.props.requestAccess();
    if (this.props.isSignedIntoWallet && this.props.isLoggedIn) {
      pathname === '/' && history.push(routes.PROFILE);
      await this.props.profileGetBox();
      await this.props.getActivity();
      await this.props.getPublicName();
      await this.props.getPublicGithub();
      await this.props.getPublicImage();
      await this.props.getPrivateEmail();
    } else if (this.props.isSignedIntoWallet && !this.props.isLoggedIn && (pathname === '/Profile' || pathname === '/EditProfile')) {
      history.push(routes.LANDING);
      this.props.handleSignInModal();
    }
  }

  render() {
    const {
      showDifferentNetworkModal,
      accessDeniedModal,
      allowAccessModal,
      loggedOutModal,
      switchedAddressModal,
      prevNetwork,
      currentNetwork,
      onBoardingModal,
      onBoardingModalTwo,
      ifFetchingThreeBox,
    } = this.props;

    const { onBoardingModalMobileOne, onBoardingModalMobileTwo, onBoardingModalMobileThree } = this.state;
    const prevPrevNetwork = window.localStorage.getItem('prevPrevNetwork');
    const currentNetworkState = window.localStorage.getItem('currentNetwork');

    const { width } = this.state;
    const isMobile = width <= 600;

    return (
      <div className="App">
        <LoadingThreeBoxProfileModal show={ifFetchingThreeBox} />

        <ProvideAccessModal
          handleAccessModal={this.props.handleAccessModal}
          show={allowAccessModal}
          isMobile={isMobile} />

        <AccessDeniedModal
          handleDeniedAccessModal={this.props.handleDeniedAccessModal}
          show={accessDeniedModal}
          isMobile={isMobile} />

        <SwitchedNetworksModal
          prevNetwork={prevNetwork}
          currentNetwork={currentNetwork}
          isMobile={isMobile}
          proceedWithSwitchedAddressModal={this.props.proceedWithSwitchedAddressModal}
          show={(showDifferentNetworkModal && prevPrevNetwork !== currentNetworkState)}
        />

        <LoggedOutModal
          isMobile={isMobile}
          handleLoggedOutModal={this.props.handleLoggedOutModal}
          handleSignOut={this.props.handleSignOut}
          show={loggedOutModal}
        />

        <SwitchedAddressModal
          handleSwitchedAddressModal={this.props.handleSwitchedAddressModal}
          show={switchedAddressModal}
          isMobile={isMobile}
          handleSignOut={this.props.handleSignOut}
        />

        <OnBoardingModalDesktop
          isMobile={isMobile}
          showOne={onBoardingModal}
          showTwo={onBoardingModalTwo}
          handleOnboardingModal={this.props.handleOnboardingModal} />

        <OnBoardingModalMobile
          isMobile={isMobile}
          handleOnboardingModal={this.props.handleOnboardingModal}
          showOne={onBoardingModal}
          showTwo={onBoardingModalMobileOne}
          showThree={onBoardingModalMobileTwo}
          showFour={onBoardingModalMobileThree}
          handleNextMobileModal={this.handleNextMobileModal} />

        <Switch>
          <Route exact path={routes.LANDING} component={Landing} />
          <Route path={routes.PROFILE} component={Profile} />
          <Route path={routes.EDITPROFILE} component={EditProfile} />
          <Route path={routes.PRIVACY} component={Privacy} />
          <Route path={routes.TERMS} component={Terms} />
        </Switch>
      </div>
    );
  }
}

App.propTypes = {
  profileGetBox: PropTypes.func,
  requestAccess: PropTypes.func,
  getPublicName: PropTypes.func,
  getPublicGithub: PropTypes.func,
  getPublicImage: PropTypes.func,
  getPrivateEmail: PropTypes.func,
  getActivity: PropTypes.func,
  checkWeb3Wallet: PropTypes.func,
  requireMetaMaskModal: PropTypes.func,
  handleMobileWalletModal: PropTypes.func,
  closeDifferentNetworkModal: PropTypes.func,
  proceedWithSwitchedAddressModal: PropTypes.func,
  handleAccessModal: PropTypes.func,
  handleDeniedAccessModal: PropTypes.func,
  handleSignOut: PropTypes.func,
  checkNetwork: PropTypes.func,
  handleSignInModal: PropTypes.func,
  handleLoggedOutModal: PropTypes.func,
  handleSwitchedAddressModal: PropTypes.func,
  handleOnboardingModal: PropTypes.func,

  location: PropTypes.object,
  hasWallet: PropTypes.bool,
  showDifferentNetworkModal: PropTypes.bool,
  accessDeniedModal: PropTypes.bool,
  allowAccessModal: PropTypes.bool,
  isLoggedIn: PropTypes.bool,
  isSignedIntoWallet: PropTypes.bool,
  hasWallet: PropTypes.bool,
  switched: PropTypes.bool,
  loggedOutModal: PropTypes.bool,
  switchedAddressModal: PropTypes.bool,
  onBoardingModal: PropTypes.bool,
  onBoardingModalTwo: PropTypes.bool,
  ifFetchingThreeBox: PropTypes.bool,
  prevNetwork: PropTypes.string,
  currentNetwork: PropTypes.string,
  prevPrevNetwork: PropTypes.string,
};

App.defaultProps = {
  profileGetBox: profileGetBox(),
  requestAccess: requestAccess(),
  getPublicName: getPublicName(),
  getPublicGithub: getPublicGithub(),
  getPublicImage: getPublicImage(),
  getPrivateEmail: getPrivateEmail(),
  getActivity: getActivity(),
  checkWeb3Wallet: checkWeb3Wallet(),
  requireMetaMaskModal: requireMetaMaskModal(),
  handleMobileWalletModal: handleMobileWalletModal(),
  closeDifferentNetworkModal: closeDifferentNetworkModal(),
  proceedWithSwitchedAddressModal: proceedWithSwitchedAddressModal(),
  handleAccessModal: handleAccessModal(),
  handleDeniedAccessModal: handleDeniedAccessModal(),
  checkNetwork: checkNetwork(),
  handleSignInModal: handleSignInModal(),
  handleLoggedOutModal: handleLoggedOutModal(),
  handleSwitchedAddressModal: handleSwitchedAddressModal(),
  handleSignOut: handleSignOut(),
  handleOnboardingModal: handleOnboardingModal(),

  location: {},
  hasWallet: true,
  showDifferentNetworkModal: false,
  accessDeniedModal: false,
  allowAccessModal: false,
  switched: false,
  loggedOutModal: false,
  switchedAddressModal: false,
  onBoardingModal: false,
  onBoardingModalTwo: false,
  ifFetchingThreeBox: false,
  isLoggedIn: false,
  isSignedIntoWallet: false,
  hasWallet: false,
  prevNetwork: '',
  currentNetwork: '',
  prevPrevNetwork: '',
};

const mapState = state => ({
  hasWallet: state.threeBox.hasWallet,
  showDifferentNetworkModal: state.threeBox.showDifferentNetworkModal,
  accessDeniedModal: state.threeBox.accessDeniedModal,
  allowAccessModal: state.threeBox.allowAccessModal,
  switched: state.threeBox.switched,
  loggedOutModal: state.threeBox.loggedOutModal,
  switchedAddressModal: state.threeBox.switchedAddressModal,
  onBoardingModal: state.threeBox.onBoardingModal,
  onBoardingModalTwo: state.threeBox.onBoardingModalTwo,
  prevNetwork: state.threeBox.prevNetwork,
  currentNetwork: state.threeBox.currentNetwork,
  prevPrevNetwork: state.threeBox.prevPrevNetwork,
  isLoggedIn: state.threeBox.isLoggedIn,
  isSignedIntoWallet: state.threeBox.isSignedIntoWallet,
  hasWallet: state.threeBox.hasWallet,
  ifFetchingThreeBox: state.threeBox.ifFetchingThreeBox,
});

export default withRouter(connect(mapState,
  {
    profileGetBox,
    requestAccess,
    getPublicName,
    getPublicGithub,
    getPublicImage,
    getPrivateEmail,
    getActivity,
    checkWeb3Wallet,
    requireMetaMaskModal,
    handleMobileWalletModal,
    checkNetwork,
    handleSignInModal,
    closeDifferentNetworkModal,
    proceedWithSwitchedAddressModal,
    handleAccessModal,
    handleDeniedAccessModal,
    handleLoggedOutModal,
    handleSignOut,
    handleSwitchedAddressModal,
    handleOnboardingModal,
  })(App));


    // if ((pathname === '/Profile' || pathname === '/EditProfile') && typeof window.web3 !== 'undefined') { // eslint-disable-line no-undef
    //   // if user is logged in and lands on restricted pages
    //   this.loadData();
    // } 
    // else if (pathname === '/' && typeof window.web3 !== 'undefined' && loginStatus) { // eslint-disable-line no-undef
    //   // if user is logged in and lands on landing page, redirect them to profile page
    //   history.push(routes.PROFILE);
    //   this.loadData();
    // } 
    // else if ((pathname === '/Profile' || pathname === '/EditProfile') && !loginStatus) {
    //   // if user is not logged in and lands on restricted pages, redirect them to landing page
    //   history.push(routes.LANDING);
    //   this.props.handleSignInModal();
    // }