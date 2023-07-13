import { Theme } from '@mui/material/styles';
import { keyframes } from 'tss-react';
import { makeStyles } from 'tss-react/mui';

const SLIDE_IN_TRANSFORM = 'matrix(0.01471, 0, 0, 1, 123.982745, 0.000015)';
const SLIDE_OUT_TRANSFORM = 'translate(0)';

const slideIn = keyframes`
  from {
    transform: ${SLIDE_IN_TRANSFORM};
  }
  to {
    transform: ${SLIDE_OUT_TRANSFORM};
  }
`;

const slideOut = keyframes`
  from {
    transform: ${SLIDE_OUT_TRANSFORM};
  },
  to {
    transform: ${SLIDE_IN_TRANSFORM};
  },
`;

const useStyles = makeStyles<void, 'linkItem'>()(
  (theme: Theme, _params, classes) => ({
    menuGrid: {
      minHeight: 64,
      height: '100%',
      width: '100%',
      margin: 0,
      padding: 0,
      [theme.breakpoints.up('sm')]: {
        minHeight: 72,
      },
      [theme.breakpoints.up('md')]: {
        minHeight: 80,
      },
      '&:hover': {
        '& path.akamai-clip-path': {
          animation: `${slideIn} .33s ease-in-out`,
        },
      },
    },
    fadeContainer: {
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100% - 90px)',
      width: '100%',
    },
    logoItemAkamai: {
      paddingTop: 12,
      paddingLeft: 12,
      transition: 'padding-left .03s linear',
      '& path.akamai-clip-path': {
        animation: `${slideIn} .33s ease-in-out`,
      },
    },
    logoItemAkamaiCollapsed: {
      paddingLeft: 8,
    },
    logoAkamaiCollapsed: {
      background: theme.bg.primaryNavPaper,
      width: 96,
      '& path.akamai-clip-path': {
        animation: `${slideOut} 0s ease-in-out 0s forwards`,
      },
    },
    listItem: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      padding: '8px 16px',
      position: 'relative',
      transition: theme.transitions.create(['background-color']),
      '& p': {
        marginTop: 0,
        marginBottom: 0,
      },
      '&:focus': {
        textDecoration: 'none',
      },
      '&:hover': {
        border: 'red',
        backgroundImage: 'linear-gradient(98deg, #38584B 1%, #3A5049 166%)',
        textDecoration: 'none',
        [`& .${classes.linkItem}`]: {
          color: 'white',
        },
        '& .icon': {
          opacity: 1,
        },
        '& svg': {
          color: theme.color.teal,
          fill: theme.color.teal,
        },
      },
      '& .icon': {
        color: '#CFD0D2',
        marginRight: theme.spacing(2),
        opacity: 0.5,
        '& svg': {
          display: 'flex',
          alignItems: 'center',
          height: 20,
          width: 20,
          '&:not(.wBorder) circle, & .circle': {
            display: 'none',
          },
        },
      },
    },
    linkItem: {
      display: 'flex',
      alignItems: 'center',
      color: '#fff',
      fontFamily: 'LatoWebBold', // we keep this bold at all times
      opacity: 1,
      position: 'relative',
      transition: theme.transitions.create(['color']),
      '&.hiddenWhenCollapsed': {
        opacity: 0,
        maxHeight: 36,
      },
    },
    active: {
      backgroundImage: 'linear-gradient(98deg, #38584B 1%, #3A5049 166%)',
      textDecoration: 'none',
      '& .icon': {
        opacity: 1,
      },
      '& svg': {
        color: theme.color.teal,
      },
    },
    divider: {
      backgroundColor: 'rgba(0, 0, 0, 0.12)',
      color: '#222',
    },
    chip: {
      marginTop: 2,
      '&.beta-chip-aglb': {
        position: 'absolute',
        left: 70,
        bottom: -2,
      },
    },
    logoSvgCollapsed: {
      // Hide 'Akamai' text when the navigation is collapsed and the nav is not hovered
      '& > g ': {
        display: 'none',
      },
      'nav:hover & > g ': {
        display: 'unset',
      },
      // Make the logo 115px so that the Akamai logo is centered when the navigation is collapsed
      width: 115,
    },
    logoContainer: {
      // when the nav is collapsed, but hovered by the user, make the logo full sized
      'nav:hover & > svg ': {
        width: 128,
      },
    },
    logo: {
      // give the svg a transition so it smoothly resizes
      transition: 'width .1s linear',
    },
  })
);

// TODO jss-to-tss-react codemod: usages of this hook outside of this file will not be converted.
export default useStyles;
