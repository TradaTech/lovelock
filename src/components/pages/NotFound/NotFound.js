import React from 'react';
import styled from 'styled-components';
// import { ButtonPro } from '../../elements/Button';
import Fab from '@material-ui/core/Fab';
import { makeStyles } from '@material-ui/core/styles';
import { rem } from '../../elements/StyledUtils';
import notFoundImg from '../../../assets/img/404PageBackground.jpg';

const NotFoundContainer = styled.div`
  color: white;

  img {
    position: fixed;
    width: 100%;
    height: 100%;
  }
  .title {
    font-size: 30px;
    font-weight: bold;
    position: absolute;
    font-family: 'Montserrat Bold';
    top: ${rem(210)};
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .title404 {
    font-size: 75pt;
    font-weight: bold;
    font-family: 'Montserrat Black';
    position: absolute;
    top: ${rem(470)};
    left: 51%;
    transform: translate(-50%, -50%);
  }
  .guide {
    font-size: 14pt;
    font-family: 'Montserrat Semibold';
    position: absolute;
    top: ${rem(750)};
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .btn {
    font-size: 24pt;
    font-family: 'Montserrat Bolc';
    position: absolute;
    top: ${rem(800)};
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;

const useStyles = makeStyles(theme => ({
  styledButton: {
    margin: theme.spacing(1),
    width: theme.spacing(30),
    // backgroundColor: 'transparent',
    color: 'white',
    fontSize: '24px',
  },
}));

function NotFound(props) {
  const classes = useStyles();
  return (
    <NotFoundContainer>
      <img src={notFoundImg} alt="tradatech" />
      <div className="title">
        <span>OOPS, PAGE NOT FOUND!</span>
      </div>
      <div className="title404">
        <span>404</span>
      </div>
      <div className="guide">
        <span>Perhaps you are wandering too far. Click the button below to come back home.</span>
      </div>
      <div className="btn">
        <Fab
          variant="extended"
          color="secondary"
          className={classes.styledButton}
          onClick={() => {
            props.history.push('/');
          }}
        >
          RETURN HOME
        </Fab>
      </div>
    </NotFoundContainer>
  );
}

function Exception() {
  return (
    <div>
      <div className="not-found exception">
        <p>Oops! We couldn't find what you're looking for.</p>
      </div>
    </div>
  );
}
export { NotFound, Exception };
export default NotFound;
