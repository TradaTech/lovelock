import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { LeftBoxWrapper } from '../../elements/StyledUtils';
import LeftContainer from '../Lock/LeftContainer';
import MemoryList from '../Memory/MemoryList';
import * as actions from '../../../store/actions';

import APIService from '../../../service/apiService';
import appConstants from "../../../helper/constants";

import { useDidUpdate } from '../../../helper/hooks'

function Explore(props) {
  const { setMemories, memoryList, setLocks } = props;
  const notOwnMemorySrc = memoryList.src !== 'explore';

  const [loading, setLoading] = useState(notOwnMemorySrc);
  const [changed, setChanged] = useState(false);
  const [page, setPage] = useState(1);
  const [noMoreMemories, setNoMoreMemories] = useState(false);

  const indexParam = Number(props.match.params.index)
  const pinIndex = (indexParam > 0 && Number.isInteger(indexParam)) ? indexParam : null

  // remove items on left sidebar, will add lock/user choices later
  useEffect(() => {
    APIService.getFeaturedChoices().then(setLocks)
  }, [setLocks])

  useEffect(() => {
    if (page !== 1) {
      setPage(1)
      setNoMoreMemories(false)
    }
    fetchMemories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pinIndex]);

  useDidUpdate(() => {
    if (page === 1 || noMoreMemories) return

    fetchMemories(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useDidUpdate(() => {
    fetchMemories(false, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changed]);

  function fetchMemories(pageChanged = false, loadToCurrentPage = false) {
    if (notOwnMemorySrc) {
      setLoading(notOwnMemorySrc);
      setMemories([]);
    } else if (!pageChanged && !loadToCurrentPage) {
      return
    }

    APIService.getChoiceMemories(pinIndex, page, appConstants.memoryPageSize, loadToCurrentPage).then(result => {
      if (result.length < appConstants.memoryPageSize) {
        setNoMoreMemories(true);
      }

      let memories = result;
      if (page > 1 && !loadToCurrentPage) memories = memoryList.concat(result);
      setMemories(memories);
      setLoading(false);
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }

  function refresh() {
    setChanged(c => !c);
  }

  function nextPage() {
    if (noMoreMemories) return;
    setPage(page + 1);
  }

  return (
    <LeftBoxWrapper>
      <div className="proposeColumn proposeColumn--left">
        <LeftContainer loading={loading} context="explore" featured />
      </div>
      <div className="proposeColumn proposeColumn--right">
        <MemoryList
          {...props}
          pinIndex={pinIndex}
          noCreateMemory
          onMemoryChanged={refresh}
          loading={loading}
          nextPage={nextPage}
        />
      </div>
    </LeftBoxWrapper>
  );
}

const mapStateToProps = state => {
  return { memoryList: state.loveinfo.memories };
};

const mapDispatchToProps = dispatch => {
  return {
    setMemories: value => {
      value.src = 'explore'
      dispatch(actions.setMemories(value));
    },
    setLocks: value => {
      dispatch(actions.setLocks(value));
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Explore);
