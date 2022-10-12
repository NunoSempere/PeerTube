import { VideoModel } from '@server/models/video/video'
import { MVideoFullLight } from '@server/types/models'
import { VideoPrivacy, VideoState } from '@shared/models'
import { logger } from '../../helpers/logger'
import { SCHEDULER_INTERVALS_MS } from '../../initializers/constants'
import { sequelizeTypescript } from '../../initializers/database'
import { ScheduleVideoUpdateModel } from '../../models/video/schedule-video-update'
import { Notifier } from '../notifier'
import { addVideoJobsAfterUpdate } from '../video'
import { setVideoPrivacy } from '../video-privacy'
import { AbstractScheduler } from './abstract-scheduler'

export class UpdateVideosScheduler extends AbstractScheduler {

  private static instance: AbstractScheduler

  protected schedulerIntervalMs = SCHEDULER_INTERVALS_MS.UPDATE_VIDEOS

  private constructor () {
    super()
  }

  protected async internalExecute () {
    return this.updateVideos()
  }

  private async updateVideos () {
    if (!await ScheduleVideoUpdateModel.areVideosToUpdate()) return undefined

    const schedules = await ScheduleVideoUpdateModel.listVideosToUpdate()
    const publishedVideos: MVideoFullLight[] = []

    for (const schedule of schedules) {
      let oldPrivacy: VideoPrivacy
      let isNewVideo: boolean

      const video = await sequelizeTypescript.transaction(async t => {
        const video = await VideoModel.loadFull(schedule.videoId, t)
        if (video.state === VideoState.TO_TRANSCODE) return

        logger.info('Executing scheduled video update on %s.', video.uuid)

        if (schedule.privacy) {
          isNewVideo = video.isNewVideo(schedule.privacy)
          oldPrivacy = video.privacy

          setVideoPrivacy(video, schedule.privacy)
          await video.save({ transaction: t })

          if (oldPrivacy === VideoPrivacy.PRIVATE) {
            publishedVideos.push(video)
          }
        }

        await schedule.destroy({ transaction: t })

        return video
      })

      await addVideoJobsAfterUpdate({ video, oldPrivacy, isNewVideo, nameChanged: false })
    }

    for (const v of publishedVideos) {
      Notifier.Instance.notifyOnVideoPublishedAfterScheduledUpdate(v)
    }
  }

  static get Instance () {
    return this.instance || (this.instance = new this())
  }
}
