import React from 'react';
import PropTypes from 'prop-types';

import classNames from 'classnames';
import { useSelector } from 'react-redux';
import {
  Redirect, Route, Switch, useLocation,
} from 'react-router';

import { RequestStatus, Routes } from '../../data/constants';
import { useIsOnDesktop, useIsOnXLDesktop, useShowLearnersTab } from '../data/hooks';
import { selectconfigLoadingStatus } from '../data/selectors';
import { LearnerPostsView, LearnersView } from '../learners';
import { PostsView } from '../posts';
import { TopicsView } from '../topics';

export default function DiscussionSidebar({ displaySidebar }) {
  const location = useLocation();
  const isOnDesktop = useIsOnDesktop();
  const isOnXLDesktop = useIsOnXLDesktop();
  const configStatus = useSelector(selectconfigLoadingStatus);
  const redirectToLearnersTab = useShowLearnersTab();
  return (
    <div
      className={classNames('flex-column', {
        'd-none': !displaySidebar,
        'd-flex h-100 overflow-auto': displaySidebar,
        'w-100': !isOnDesktop,
        'sidebar-desktop-width': isOnDesktop && !isOnXLDesktop,
        'w-25 sidebar-XL-width': isOnXLDesktop,
      })}
      data-testid="sidebar"
    >
      <Switch>
        <Route
          path={[Routes.POSTS.PATH, Routes.POSTS.ALL_POSTS, Routes.TOPICS.CATEGORY, Routes.POSTS.MY_POSTS]}
          component={PostsView}
        />
        <Route path={Routes.TOPICS.PATH} component={TopicsView} />
        {redirectToLearnersTab && (
        <Route path={Routes.LEARNERS.POSTS} component={LearnerPostsView} />
        )}
        {redirectToLearnersTab && (
        <Route path={Routes.LEARNERS.PATH} component={LearnersView} />
        )}

        {configStatus === RequestStatus.SUCCESSFUL && (
        <Redirect
          from={Routes.DISCUSSIONS.PATH}
          to={{
            ...location,
            pathname: Routes.POSTS.ALL_POSTS,
          }}
        />
        )}
      </Switch>
    </div>
  );
}

DiscussionSidebar.defaultProps = {
  displaySidebar: false,
};

DiscussionSidebar.propTypes = {
  displaySidebar: PropTypes.bool,
};
