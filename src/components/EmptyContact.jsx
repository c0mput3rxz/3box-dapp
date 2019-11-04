import React from 'react';
import PropTypes from 'prop-types';

import '../views/Profile/styles/Profile.css';

const EmptyContact = () => (
  <div className="feed_activity_empty">
    <p className="feed_activity_empty_text">
      You're not following anyone yet
    </p>
  </div>
);

EmptyContact.propTypes = {
  user: PropTypes.object,
  isFollowing: PropTypes.bool,
  fromModal: PropTypes.bool,
  handleContactsModal: PropTypes.func.isRequired,
  address: PropTypes.string,
};

EmptyContact.defaultProps = {
  user: {},
  isFollowing: false,
  fromModal: false,
  address: '',
};

export default EmptyContact;