import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Badge, Icon } from '@edx/paragon';

import { PushPin } from '../../../components/icons';
import { AvatarOutlineAndLabelColors, Routes, ThreadType } from '../../../data/constants';
import AuthorLabel from '../../common/AuthorLabel';
import { DiscussionContext } from '../../common/context';
import { selectUserHasModerationPrivileges, selectUserIsGroupTa } from '../../data/selectors';
import { discussionsPath, isPostPreviewAvailable } from '../../utils';
import messages from './messages';
import PostFooter from './PostFooter';
import { PostAvatar } from './PostHeader';
import { postShape } from './proptypes';

function PostLink({
  post,
  isSelected,
  intl,
  learnerTab,
  showDivider,
  idx,
}) {
  const {
    page,
    postId,
    inContext,
    category,
    learnerUsername,
  } = useContext(DiscussionContext);
  const linkUrl = discussionsPath(Routes.COMMENTS.PAGES[page], {
    0: inContext ? 'in-context' : undefined,
    courseId: post.courseId,
    topicId: post.topicId,
    postId: post.id,
    category,
    learnerUsername,
  });
  const userHasModerationPrivileges = useSelector(selectUserHasModerationPrivileges);
  const userIsGroupTa = useSelector(selectUserIsGroupTa);
  const showAnsweredBadge = post.hasEndorsed && post.type === ThreadType.QUESTION;
  const authorLabelColor = AvatarOutlineAndLabelColors[post.authorLabel];
  const postReported = post.abuseFlagged || post.abuseFlaggedCount;
  const canSeeReportedBadge = postReported && (userHasModerationPrivileges || userIsGroupTa);

  return (
    <>
      <Link
        className={
          classNames('discussion-post p-0 text-decoration-none text-gray-900', {
            'border-bottom border-light-400': showDivider,
          })
        }
        to={linkUrl}
        onClick={() => isSelected(post.id)}
        style={{ lineHeight: '21px' }}
        aria-current={isSelected(post.id) ? 'page' : undefined}
        role="option"
        tabindex={(isSelected(post.id) || idx === 0) ? 0 : -1}
      >
        <div
          className={
            classNames('d-flex flex-row pt-2.5 pb-2 px-4 border-primary-500 position-relative',
              { 'bg-light-300': post.read })
          }
          style={post.id === postId ? {
            borderRightWidth: '4px',
            borderRightStyle: 'solid',
          } : null}
        >
          <PostAvatar post={post} authorLabel={post.authorLabel} fromPostLink read={post.read} />
          <div className="d-flex flex-column flex-fill" style={{ minWidth: 0 }}>
            <div className="d-flex flex-column justify-content-start mw-100 flex-fill">
              <div className="d-flex align-items-center pb-0 mb-0 flex-fill font-weight-500">
                <div
                  className={
                    classNames('text-truncate font-weight-500 font-size-14 text-primary-500 font-style-normal font-family-inter',
                      { 'font-weight-bolder': !post.read })
                  }
                >
                  {post.title}
                </div>

                {showAnsweredBadge && (
                <Badge variant="success" className="font-weight-500 ml-auto badge-padding">
                  {intl.formatMessage(messages.answered)}
                  <span className="sr-only">{' '}answered</span>
                </Badge>
                )}

                {canSeeReportedBadge && (
                <Badge
                  variant="danger"
                  data-testid="reported-post"
                  className={`font-weight-500 badge-padding ${showAnsweredBadge ? 'ml-2' : 'ml-auto'}`}
                >
                  {intl.formatMessage(messages.contentReported)}
                  <span className="sr-only">{' '}reported</span>
                </Badge>
                )}

                {post.pinned && (
                <Icon
                  src={PushPin}
                  className={`icon-size ${canSeeReportedBadge || showAnsweredBadge ? 'ml-2' : 'ml-auto'}`}
                />
                )}
              </div>
            </div>
            <AuthorLabel
              author={post.author || intl.formatMessage(messages.anonymous)}
              authorLabel={post.authorLabel}
              labelColor={authorLabelColor && `text-${authorLabelColor}`}
              linkToProfile={!learnerTab && post.author}
            />
            <div
              className="text-truncate text-primary-500 font-weight-normal font-size-14 font-style-normal font-family-inter"
              style={{ maxHeight: '1.5rem' }}
            >
              {isPostPreviewAvailable(post.previewBody)
                ? post.previewBody
                : intl.formatMessage(messages.postWithoutPreview)}
            </div>
            <div className="mt-1">
              <PostFooter post={post} preview intl={intl} />
            </div>
          </div>
        </div>
        {!showDivider && post.pinned && <div className="pt-1 bg-light-500 border-top border-light-700" />}
      </Link>
    </>
  );
}

PostLink.propTypes = {
  post: postShape.isRequired,
  isSelected: PropTypes.func.isRequired,
  intl: intlShape.isRequired,
  learnerTab: PropTypes.bool,
  showDivider: PropTypes.bool,
  idx: PropTypes.number,
};

PostLink.defaultProps = {
  learnerTab: false,
  showDivider: true,
  idx: -1,
};

export default injectIntl(PostLink);
