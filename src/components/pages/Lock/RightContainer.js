import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch, connect } from 'react-redux';

import MemoryList from '../Memory/MemoryList';
import * as actions from '../../../store/actions';
import APIService from '../../../service/apiService';
import appConstants from '../../../helper/constants';
import { useDidUpdate } from '../../../helper/hooks';

function RightContainer(props) {
  const { proIndex, collectionId, memoryList } = props;
  const topInfo = useSelector((state) => state.loveinfo.topInfo);
  const collections = topInfo.collections;
  const currentCol = collections == null ? '' : collections.find((c) => c.id === collectionId);
  const collectionName = currentCol == null ? '' : currentCol.name;
  const validCollectionId = collectionName ? collectionId : null;

  const srcId = String(proIndex) + '/' + (validCollectionId || '');
  const notOwnMemorySrc = memoryList.src !== 'lock' || memoryList.srcId !== srcId;

  const [changed, setChanged] = useState(false);
  const [loading, setLoading] = useState(notOwnMemorySrc);
  const [page, setPage] = useState(1);
  const [noMoreMemories, setNoMoreMemories] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
      setNoMoreMemories(false);
    }
    fetchMemories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proIndex, validCollectionId]);

  useDidUpdate(() => {
    if (page === 1 || noMoreMemories) return;
    fetchMemories(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // if changed is forced, reload memories no matter what
  useDidUpdate(() => {
    fetchMemories(false, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changed]);

  function fetchMemories(pageChanged = false, loadToCurrentPage = false) {
    if (notOwnMemorySrc) {
      setLoading(true);
      setMemories([]);
    } else if (!pageChanged && !loadToCurrentPage) {
      return;
    }

    APIService.getMemoriesByLockIndex(proIndex, validCollectionId, page, appConstants.memoryPageSize, loadToCurrentPage)
      .then((result) => {
        if (result.length < appConstants.memoryPageSize) {
          setNoMoreMemories(true);
        }

        let memories = result;
        if (page > 1 && !loadToCurrentPage) memories = memoryList.concat(result);
        setMemories(memories);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }

  function setMemories(value) {
    value.src = 'lock';
    value.srcId = srcId;
    dispatch(actions.setMemories(value));
  }

  function nextPage() {
    if (noMoreMemories) return;
    setPage(page + 1);
  }

  function refresh() {
    setChanged((c) => !c);
  }

  return (
    <MemoryList
      {...props}
      onMemoryChanged={refresh}
      loading={loading}
      collections={collections}
      collectionId={validCollectionId}
      collectionName={collectionName}
      nextPage={nextPage}
    />
  );
}

const mapStateToProps = (state) => {
  return { memoryList: state.loveinfo.memories };
};

export default connect(mapStateToProps)(RightContainer);
