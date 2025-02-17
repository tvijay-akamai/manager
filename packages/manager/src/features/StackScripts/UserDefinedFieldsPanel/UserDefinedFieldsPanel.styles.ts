import { Box, Paper, omittedProps } from '@linode/ui';
import { styled } from '@mui/material/styles';

export const StyledBox = styled(Box, { label: 'StyledBox' })(({ theme }) => ({
  '& > img': {
    height: 60,
    width: 60,
  },
  alignItems: 'center',
  columnGap: theme.spacing(),
  display: 'flex',
}));

type StyledPaperProps = {
  isDrawerOpenable: boolean;
};

export const StyledPaper = styled(Paper, {
  label: 'StyledPaper',
  shouldForwardProp: omittedProps(['isDrawerOpenable']),
})<StyledPaperProps>(({ isDrawerOpenable, theme }) => ({
  '& > div:last-child': {
    border: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  ...(isDrawerOpenable
    ? {
        padding: `${theme.spacing()} ${theme.spacing(3)}`,
      }
    : {
        padding: theme.spacing(3),
      }),
  marginBottom: theme.spacing(3),
}));
