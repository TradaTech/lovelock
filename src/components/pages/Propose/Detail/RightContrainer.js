import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { rem } from '../../../elements/StyledUtils';
import { callView, getTagsInfo } from '../../../../helper';
import MemoryContainer from '../../Memory/MemoryContainer';
import CreateMemory from '../../Memory/CreateMemory';
import * as actions from '../../../../store/actions';

const RightBox = styled.div`
  padding: 0 0 ${rem(45)} ${rem(45)};
`;

export default function RightContrainer(props) {
  // const { proIndex } = props;
  const dispatch = useDispatch();
  const privateKey = useSelector(state => state.account.privateKey);
  const [loading, setLoading] = useState(true);
  const [memoryList, setMemoryList] = useState([]);

  useEffect(() => {
    loadMemory(props.proIndex);
  }, [props.proIndex]);

  function setNeedAuth(value) {
    dispatch(actions.setNeedAuth(value));
  }

  async function loadMemory(proIndex) {
    const allMemory = await callView('getMemoriesByProIndex', [proIndex]);
    let newMemoryList = [];
    setLoading(true);
    setTimeout(async () => {
      for (let i = 0; i < allMemory.length; i++) {
        const obj = allMemory[i];
        if (obj.isPrivate && !privateKey) {
          setNeedAuth(true);
          break;
        }
      }

      for (let i = 0; i < allMemory.length; i++) {
        const obj = allMemory[i];
        const sender = obj.sender;
        obj.info = JSON.parse(obj.info);
        const reps = await getTagsInfo(sender);
        obj.name = reps['display-name'];
        obj.pubkey = reps['pub-key'];
        obj.avatar = reps['avatar'];
        newMemoryList.push(obj);
      }

      newMemoryList = newMemoryList.reverse();
      setMemoryList(newMemoryList);
      setLoading(false);
    }, 100);
  }

  return (
    <RightBox>
      <CreateMemory proIndex={props.proIndex} reLoadMemory={loadMemory} />
      <MemoryContainer proIndex={props.proIndex} loading={loading} memoryList={memoryList} />
    </RightBox>
  );
}