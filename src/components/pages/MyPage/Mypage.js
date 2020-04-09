import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { connect, useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Typography } from '@material-ui/core';
import BookmarkIcon from '@material-ui/icons/Bookmark';
import BookmarkBorderIcon from '@material-ui/icons/BookmarkBorder';
import { useSnackbar } from 'notistack';
import { FormattedMessage } from 'react-intl';

import LoyaltyIcon from '@material-ui/icons/Loyalty';
import PersonIcon from '@material-ui/icons/Person';
import { rem, LeftBoxWrapper } from '../../elements/StyledUtils';
import LeftContainer from '../Lock/LeftContainer';
import MemoryList from '../Memory/MemoryList';
import { AvatarPro } from '../../elements';
import { callView } from '../../../helper';
import { useTx, useDidUpdate } from '../../../helper/hooks';
import * as actions from '../../../store/actions';
import APIService from '../../../service/apiService';
import appConstants from '../../../helper/constants';
import EmptyPage from '../../layout/EmptyPage';

const BannerContainer = styled.div`
  margin-bottom: ${rem(20)};
  @media (max-width: 768px) {
    margin: 0.4rem;
  }
`;

const ShadowBox = styled.div`
  padding: 30px 30px 10px 30px;
  border-radius: 10px;
  background: linear-gradient(320deg, #eee, #ddd);
  background-image: url("/static/img/small_tiles.png");
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.15);
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const ProfileCover = styled.div``;
const CoverBox = styled.div`
  text-align: center;
`;
const NavbarBox = styled.div`
  .proLike {
    display: flex;
    height: 50px;
    padding: 8px 0;
    box-sizing: border-box;
    justify-content: flex-end;
  }
`;
const PointShow = styled.div`
  display: flex;
  padding: 5px 0;
  box-sizing: border-box;
  justify-content: center;
`;

const useStyles = makeStyles(theme => ({
  avatar: {
    width: 126,
    height: 126,
    margin: '0 auto',
  },
  displayName: {
    paddingTop: theme.spacing(1),
    textTransform: 'capitalize',
  },
  btLikeFollow: {
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(1),
  },
  titlePoint: {
    marginLeft: theme.spacing(2),
    color: '#8250c8',
  },
  titleIcon: {
    color: '#8250c8',
  },
}));

function Mypage(props) {
  const { match, setLocks, setMemory, memoryList, balances, isApproved } = props;
  const classes = useStyles();
  const tx = useTx();
  const { enqueueSnackbar } = useSnackbar();
  const address = useSelector(state => state.account.address);
  const [loading, setLoading] = useState(true);
  const [myPageInfo, setMyPageInfo] = useState({
    avatar: '',
    username: '',
    address: '',
    displayname: '',
    numFollow: 0,
    isMyFollow: false,
  });

  const paramAliasOrAddr = match.params.address || address;

  const [changed, setChanged] = useState(false);
  const [page, setPage] = useState(1);
  const [noMoreMemories, setNoMoreMemories] = useState(false);

  useEffect(() => {
    async function getDataMypage() {
      callView('getDataForMypage', [paramAliasOrAddr]).then(data => {
        const info = {};
        info.avatar = data[0].avatar;
        info.username = data[0].username;
        info.displayname = data[0]['display-name'];
        info.followed = data[0].followed;
        info.address = data[0].address;
        balances[info.address] = data[0].token;
        const { numFollow, isMyFollow } = serialFollowData(data[0].followed);
        info.numFollow = numFollow;
        info.isMyFollow = isMyFollow;
        setMyPageInfo(info);
      });
    }

    getDataMypage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramAliasOrAddr]);

  useEffect(() => {
    fetchDataLocksMemories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // this only runs on DidUpdate, not DidMount
  useDidUpdate(() => {
    fetchDataLocksMemories(true);
  }, [changed]);

  function fetchDataLocksMemories(loadToCurrentPage = false) {
    APIService.getLocksForFeed(paramAliasOrAddr)
      .then(resp => {
        // set to redux
        setLocks(resp.locks);

        const memoIndex = resp.locks.reduce((tmp, lock) => {
          return lock.isMyLock ? tmp.concat(lock.memoIndex) : tmp;
        }, []);

        if (memoIndex.length > 0) {
          APIService.getMemoriesByListMemIndex(memoIndex, page, appConstants.memoryPageSize, loadToCurrentPage)
            .then(result => {
              if (!result.length) {
                setNoMoreMemories(true);
              }

              let memories = result;
              if (page > 1 && !loadToCurrentPage) memories = memoryList.concat(result);
              setMemory(memories);
              setLoading(false);
            })
            .catch(err => {
              console.error(err);
              setLoading(false);
            });
        } else {
          setMemory([]);
          setNoMoreMemories(true);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }

  function refresh() {
    setChanged(c => !c);
  }

  function nextPage() {
    if (noMoreMemories) return;
    setPage(page + 1);
  }

  function serialFollowData(follow) {
    if (!follow) return { numFollow: 0, isMyFollow: false };
    const isMyFollow = follow.includes(address);
    const num = follow.length;
    return { numFollow: num, isMyFollow };
  }

  function getNumTopFollow(_numFollow, _isMyFollow) {
    callView('getFollowedPerson', [paramAliasOrAddr]).then(data => {
      const { numFollow, isMyFollow } = serialFollowData(data);
      if (_numFollow !== numFollow || _isMyFollow !== isMyFollow) {
        setMyPageInfo({ ...myPageInfo, numFollow, isMyFollow });
      }
    });
  }

  function handleFollow() {
    try {
      let { numFollow, isMyFollow } = myPageInfo;
      if (isMyFollow) {
        numFollow -= 1;
      } else {
        numFollow += 1;
      }
      isMyFollow = !isMyFollow;
      setMyPageInfo({ ...myPageInfo, numFollow, isMyFollow });

      tx.sendCommit('followPerson', paramAliasOrAddr).then(() => {
        getNumTopFollow(numFollow, isMyFollow);
      });
    } catch (error) {
      console.error(error);
      const message = `An error occurred, please try again later`;
      enqueueSnackbar(message, { variant: 'error' });
    }
  }

  if (myPageInfo && myPageInfo.username) {
    const pathname = `/u/${myPageInfo.username}`;
    window.history.replaceState(null, '', pathname);
  }

  const isHaveLocks = props.locks.length > 0;
  const isGuest = myPageInfo.address !== address
  return (
    <>
      {!loading && (
        <>
            <div>
              <BannerContainer>
                <ShadowBox>
                  <ProfileCover>
                    <CoverBox>
                      <AvatarPro hash={myPageInfo.avatar} className={classes.avatar} />
                      <div>
                        <Typography variant="h5" className={classes.displayName}>
                          {myPageInfo.displayname}
                        </Typography>
                        <PointShow>
                        <PersonIcon className={classes.titleIcon} />
                          <Typography variant="subtitle1" color="primary">
                            &nbsp;{`@${myPageInfo.username}`}
                          </Typography>
                          <LoyaltyIcon className={classes.titlePoint} />
                          <Typography variant="subtitle1" color="primary">
                            &nbsp;{balances[myPageInfo.address || paramAliasOrAddr]}
                          </Typography>
                        </PointShow>
                      </div>
                    </CoverBox>
                    <NavbarBox>
                      <div className="proLike">
                        {/* <Button>Timeline</Button> */}
                        {/* <Button>Photos</Button> */}
                        <Button onClick={handleFollow} className={classes.btLikeFollow}>
                          {myPageInfo.isMyFollow ? (
                            <>
                              <BookmarkIcon color="primary" className={classes.rightIcon} />
                              <Typography component="span" variant="body2" color="primary" className={classes.textFollow}>
                                <FormattedMessage id="topContainer.following" />
                                {myPageInfo.numFollow > 0 && `(${myPageInfo.numFollow})`}
                              </Typography>
                            </>
                          ) : (
                            <>
                              <BookmarkBorderIcon className={classes.rightIcon} />
                              <Typography component="span" variant="body2" className={classes.textFollow}>
                                <FormattedMessage id="topContainer.follow" />
                                {myPageInfo.numFollow > 0 && `(${myPageInfo.numFollow})`}
                              </Typography>
                            </>
                          )}
                        </Button>
                      </div>
                    </NavbarBox>
                  </ProfileCover>
                </ShadowBox>
              </BannerContainer>
              {isHaveLocks ? (<LeftBoxWrapper>
                <div className="proposeColumn proposeColumn--left">
                  <LeftContainer
                    loading={loading}
                    isGuest={address !== paramAliasOrAddr || myPageInfo.username !== paramAliasOrAddr}
                  />
                </div>
                <div className="proposeColumn proposeColumn--right">
                  <MemoryList
                    {...props}
                    myPageRoute
                    onMemoryChanged={refresh}
                    loading={loading}
                    nextPage={nextPage}
                    needSelectLock={true}
                    locks={props.locks}
                    myPageInfo={myPageInfo}
                  />
                </div>
              </LeftBoxWrapper> ) : <EmptyPage 
                isApproved={isApproved} 
                history={props.history} 
                isGuest={isGuest} 
                username={myPageInfo.username} 
              />
          }
            </div>
          }
        </>
      )}
    </>
  );
}
const mapStateToProps = state => {
  return {
    locks: state.loveinfo.locks,
    address: state.account.address,
    isApproved: state.account.isApproved,
    memoryList: state.loveinfo.memories,
    balances: state.loveinfo.balances,
  };
};
const mapDispatchToProps = dispatch => {
  return {
    setLocks: value => {
      dispatch(actions.setLocks(value));
    },
    setMemory: value => {
      dispatch(actions.setMemory(value));
    },
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(Mypage);
