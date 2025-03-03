/* eslint-disable import/prefer-default-export */
import { useContext, useEffect, useRef } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation, useRouteMatch } from 'react-router';

import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { AppContext } from '@edx/frontend-platform/react';
import { breakpoints, useWindowSize } from '@edx/paragon';

import { Routes } from '../../data/constants';
import { fetchCourseBlocks } from '../../data/thunks';
import { clearRedirect } from '../posts/data';
import { selectTopics } from '../topics/data/selectors';
import { fetchCourseTopics } from '../topics/data/thunks';
import { discussionsPath, postMessageToParent } from '../utils';
import {
  selectAreThreadsFiltered, selectLearnersTabEnabled,
  selectModerationSettings,
  selectPostThreadCount,
  selectUserHasModerationPrivileges,
  selectUserIsGroupTa, selectUserIsStaff, selectUserRoles,
} from './selectors';
import { fetchCourseConfig } from './thunks';

export function useTotalTopicThreadCount() {
  const topics = useSelector(selectTopics);

  if (!topics) {
    return 0;
  }

  return Object.keys(topics).reduce((total, topicId) => {
    const topic = topics[topicId];
    return total + topic.threadCounts.discussion + topic.threadCounts.question;
  }, 0);
}

export const useSidebarVisible = () => {
  const isFiltered = useSelector(selectAreThreadsFiltered);
  const totalThreads = useSelector(selectPostThreadCount);
  const isViewingTopics = useRouteMatch(Routes.TOPICS.PATH);
  const isViewingLearners = useRouteMatch(Routes.LEARNERS.PATH);

  if (isFiltered) {
    return true;
  }

  if (isViewingTopics || isViewingLearners) {
    return true;
  }

  return totalThreads > 0;
};

export function useCourseDiscussionData(courseId) {
  const dispatch = useDispatch();
  const { authenticatedUser } = useContext(AppContext);

  useEffect(() => {
    async function fetchBaseData() {
      await dispatch(fetchCourseConfig(courseId));
      await dispatch(fetchCourseTopics(courseId));
      await dispatch(fetchCourseBlocks(courseId, authenticatedUser.username));
    }

    fetchBaseData();
  }, [courseId]);
}

export function useRedirectToThread(courseId) {
  const dispatch = useDispatch();
  const redirectToThread = useSelector(
    (state) => state.threads.redirectToThread,
  );
  const history = useHistory();
  const location = useLocation();

  return useEffect(() => {
    // After posting a new thread we'd like to redirect users to it, the topic and post id are temporarily
    // stored in redirectToThread
    if (redirectToThread) {
      dispatch(clearRedirect());
      const newLocation = discussionsPath(Routes.COMMENTS.PAGES['my-posts'], {
        courseId,
        postId: redirectToThread.threadId,
      })(location);
      history.push(newLocation);
    }
  }, [redirectToThread]);
}

export function useIsOnDesktop() {
  return window.outerWidth >= breakpoints.large.minWidth;
}

export function useIsOnXLDesktop() {
  const windowSize = useWindowSize();
  return windowSize.width >= breakpoints.extraLarge.minWidth;
}

/**
 * Given an element this attempts to get the height of the entire UI.
 *
 * @param element
 * @returns {number}
 */
function getOuterHeight(element) {
  // This is the height of the entire document body.
  const bodyHeight = document.body.offsetHeight;
  // This is the height of the container that will scroll.
  const elementContainerHeight = element.parentNode.clientHeight;
  // The difference between the body height and the container height is the size of the header footer etc.
  // Add to that the element's own height and we get the size the UI should be to fit everything.
  return bodyHeight - elementContainerHeight + element.scrollHeight + 10;
}

/**
 * This hook posts a resize message to the parent window if running in an iframe
 * @param refContainer reference to the component whose size is to be measured
 */
export function useContainerSizeForParent(refContainer) {
  function postResizeMessage(height) {
    postMessageToParent('plugin.resize', { height });
  }

  const location = useLocation();
  const enabled = window.parent !== window;

  const resizeObserver = useRef(new ResizeObserver(() => {
    /* istanbul ignore if: ResizeObserver isn't available in the testing env */
    if (refContainer.current) {
      postResizeMessage(getOuterHeight(refContainer.current));
    }
  }));

  useEffect(() => {
    const container = refContainer.current;
    const observer = resizeObserver.current;
    if (container && observer && enabled) {
      observer.observe(container);
      postResizeMessage(getOuterHeight(container));
    }

    return () => {
      if (container && observer && enabled) {
        observer.unobserve(container);
        // Send a message to reset the size so that navigating to another
        // page doesn't cause the size to be retained
        postResizeMessage(null);
      }
    };
  }, [refContainer, resizeObserver, location]);
}

export const useAlertBannerVisible = (content) => {
  const userHasModerationPrivileges = useSelector(selectUserHasModerationPrivileges);
  const userIsGroupTa = useSelector(selectUserIsGroupTa);
  const { reasonCodesEnabled } = useSelector(selectModerationSettings);
  const userIsContentAuthor = getAuthenticatedUser().username === content.author;
  const canSeeLastEditOrClosedAlert = (userHasModerationPrivileges || userIsContentAuthor || userIsGroupTa);
  const isReportedByCurrentUser = getAuthenticatedUser().username === content?.abuseFlaggedBy;
  const canSeeReportedBanner = (userHasModerationPrivileges || userIsGroupTa || isReportedByCurrentUser);

  return (
    (reasonCodesEnabled && canSeeLastEditOrClosedAlert && (content.lastEdit?.reason || content.closed))
    || (content.abuseFlagged && canSeeReportedBanner)
  );
};

export const useShowLearnersTab = () => {
  const learnersTabEnabled = useSelector(selectLearnersTabEnabled);
  const userRoles = useSelector(selectUserRoles);
  const isAdmin = useSelector(selectUserIsStaff);
  const IsGroupTA = useSelector(selectUserIsGroupTa);
  const privileged = useSelector(selectUserHasModerationPrivileges);
  const allowedUsers = isAdmin || IsGroupTA || privileged || (userRoles.includes('Student') && userRoles.length > 1);
  return learnersTabEnabled && allowedUsers;
};
