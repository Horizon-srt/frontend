<template>
  <div>
    <a-comment v-for="item in currentComments" :key="item.id">
      <Reply :solutionId="item.solution_id" :fatherNode="item.id" label="回复" />
      <a slot="author">{{ item.speaker }}</a>
      <p slot="content">
        {{ item.description }}
      </p>
      <CommentList :isRoot="false" :solutionID="0" :comments="item.kids" />
    </a-comment>
  </div>
</template>

<script>
import { getSolutionComments } from '@/api/solution_comments'
import { boolean, number } from 'yargs'
import Reply from './Reply'

export default {
  components: {
    Reply
  },
  name: 'CommentList',
  props: {
    isRoot: {
      type: boolean,
      required: true
    },
    solutionID: {
      type: number,
      required: true
    },
    comments: {
      type: Array,
      required: true
    }
  },
  data () {
    return {
      currentComments: []
    }
  },
  methods: {
    fatch () {
      if (this.isRoot) {
        // this.currentComments = [
        // {
        //   id: 1,
        //   speaker: '陌溪',
        //   description: '我是一级评论',
        //   solutionId: 1,
        //   fatherNode: 0,
        //   kids: [
        //     {
        //       id: 2,
        //       speaker: '陌溪',
        //       description: '我是二级评论',
        //       solutionId: 1,
        //       fatherNode: 1,
        //       kids: [
        //         {
        //           id: 3,
        //           speaker: '陌溪',
        //           description: '我是三级评论',
        //           solutionId: 1,
        //           fatherNode: 2,
        //           kids: []
        //         }
        //       ]
        //     }, {
        //       id: 4,
        //       speaker: '陌溪',
        //       description: '我是二级评论',
        //       solutionId: 1,
        //       fatherNode: 1,
        //       kids: []
        //     }
        //   ]
        // }
        // ]
        getSolutionComments(this.solutionID).then(data => {
          // console.log(data.solution_comment_tree.roots)
          this.currentComments = data.solution_comment_tree.roots
        })
      } else {
        this.currentComments = this.comments
      }
    }
  },
  mounted () {
    this.fatch()
  }
}
</script>

<style>
  .comment {
    display:none;
  }
</style>
