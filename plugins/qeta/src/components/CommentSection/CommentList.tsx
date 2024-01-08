import { AnswerResponse, qetaApiRef, QuestionResponse } from '../../api';
import { Box, Divider, Typography } from '@material-ui/core';
import React from 'react';
import { Link, MarkdownContent } from '@backstage/core-components';
import { useStyles } from '../../utils/hooks';
import { useApi } from '@backstage/core-plugin-api';
import { RelativeTimeWithTooltip } from '../RelativeTimeWithTooltip/RelativeTimeWithTooltip';
import { AuthorLink } from '../Links/Links';

export const CommentList = (props: {
  onCommentDelete: (
    question: QuestionResponse,
    answer?: AnswerResponse,
  ) => void;
  question: QuestionResponse;
  answer?: AnswerResponse;
}) => {
  const { question, answer, onCommentDelete } = props;
  const entity = answer ?? question;
  const styles = useStyles();
  const qetaApi = useApi(qetaApiRef);

  const deleteComment = (id: number) => {
    if (answer) {
      qetaApi.deleteAnswerComment(question.id, answer.id, id).then(a => {
        onCommentDelete(question, a);
        return;
      });
    }
    qetaApi
      .deleteQuestionComment(question.id, id)
      .then(q => onCommentDelete(q));
  };

  return (
    <>
      {entity.comments?.map(c => {
        return (
          <>
            <Box key={c.id} className="qetaCommentBox">
              <MarkdownContent
                dialect="gfm"
                content={c.content}
                className={`${styles.markdownContent} inline`}
              />
              {' – '}
              <AuthorLink entity={c} />
              <Typography variant="caption" className="qetaCommentTime">
                <RelativeTimeWithTooltip value={c.created} />
              </Typography>
              {(c.own || c.canDelete) && (
                <>
                  {' / '}
                  <Link
                    underline="none"
                    to="#"
                    className="qetaCommentDeleteBtn"
                    onClick={() => deleteComment(c.id)}
                  >
                    delete
                  </Link>
                </>
              )}
            </Box>
            <Divider />
          </>
        );
      })}
    </>
  );
};
